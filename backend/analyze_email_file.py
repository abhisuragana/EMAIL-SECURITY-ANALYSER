import argparse
import email
from email import policy
from email.parser import BytesParser
import re
import requests
import json
import ipaddress
import os
import datetime

# --- ANSI Color Codes for Terminal Output ---
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

# --- API Keys ---
# Replace with your actual API keys
VIRUSTOTAL_API_KEY = "YOUR_VIRUS_TOTAL_API_KEY"
IPINFO_API_KEY = "YOUR_IPINFO_API_KEY"
CORPORATE_DOMAIN = "yourcompany.com" # Replace with the domain you want to check for impersonation

# --- Core Functions ---
def get_ip_reputation(ip_address):
    """Checks IP reputation using VirusTotal."""
    try:
        url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip_address}"
        headers = {"x-apikey": VIRUSTOTAL_API_KEY}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            analysis_stats = data.get('data', {}).get('attributes', {}).get('last_analysis_stats', {})
            malicious_count = analysis_stats.get('malicious', 0)
            suspicious_count = analysis_stats.get('suspicious', 0)
            
            if malicious_count > 0:
                return "CRITICAL", f"Detected as malicious by {malicious_count} security vendors."
            elif suspicious_count > 0:
                return "HIGH", f"Detected as suspicious by {suspicious_count} security vendors."
            else:
                return "LOW", "IP has a clean reputation."
        
        return "MEDIUM", "No reputation data found from the API."
    except requests.exceptions.RequestException:
        return "ERROR", "Could not connect to the reputation API."

def get_ip_geolocation(ip_address):
    """Gets IP geolocation data."""
    try:
        url = f"https://ipinfo.io/{ip_address}/json?token={IPINFO_API_KEY}"
        response = requests.get(url)
        data = response.json()
        return data.get('country', 'N/A'), data.get('city', 'N/A')
    except requests.exceptions.RequestException:
        return "N/A", "N/A"

def print_colored_output(label, value, color):
    """Helper function to print colored output."""
    print(f"{Colors.BOLD}{label}:{Colors.END} {color}{value}{Colors.END}")

# --- Main Analysis Logic ---
def analyze_email_file(file_path):
    """Performs a comprehensive analysis of an email file."""
    results = {}
    try:
        with open(file_path, 'rb') as fp:
            msg = BytesParser(policy=policy.default).parse(fp)
        
        # --- 1. Sender and Authentication Analysis ---
        results['sender_analysis'] = {}
        received_headers = msg.get_all('Received')
        sender_ip = None
        if received_headers:
            last_received_header = received_headers[-1]
            ip_match = re.search(r'\[?(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\]?', last_received_header)
            if ip_match:
                sender_ip = ip_match.group(1)

        if sender_ip:
            results['sender_analysis']['ip'] = sender_ip
            ip_rep_level, ip_rep_details = get_ip_reputation(sender_ip)
            results['sender_analysis']['ip_reputation'] = {'level': ip_rep_level, 'details': ip_rep_details}
            country, city = get_ip_geolocation(sender_ip)
            results['sender_analysis']['ip_location'] = f"{city}, {country}"
        
        auth_results_header = msg.get("Authentication-Results", "").lower()
        results['sender_analysis']['spf'] = "fail" if "spf=fail" in auth_results_header else "pass" if "spf=pass" in auth_results_header else "unknown"
        results['sender_analysis']['dkim'] = "fail" if "dkim=fail" in auth_results_header else "pass" if "dkim=pass" in auth_results_header else "unknown"
        results['sender_analysis']['dmarc'] = "fail" if "dmarc=fail" in auth_results_header else "pass" if "dmarc=pass" in auth_results_header else "unknown"
        
        # --- 2. Anomaly Detection ---
        results['anomaly_detection'] = {}
        sender_email_full = msg.get('From', '')
        sender_email_match = re.search(r'<(.+)>', sender_email_full)
        if sender_email_match:
            sender_email_address = sender_email_match.group(1).lower()
            if CORPORATE_DOMAIN in sender_email_address and sender_email_address != f"<{CORPORATE_DOMAIN}>":
                results['anomaly_detection']['impersonation'] = "Sender email address does not match the corporate domain."
        
        message_id = msg.get('Message-ID', '')
        if len(message_id) < 20 or len(message_id) > 100:
            results['anomaly_detection']['message_id'] = "Unusually long or short Message-ID, possibly machine-generated."
        
        return results

    except FileNotFoundError:
        return {"error": "File not found.", "risk_level": "LOW"}
    except Exception as e:
        return {"error": f"An error occurred: {e}", "risk_level": "LOW"}

def main():
    parser = argparse.ArgumentParser(description="Analyze email headers and sender reputation.")
    parser.add_argument("file", help="The path to the EML or MSG file to analyze.")
    args = parser.parse_args()
    
    analysis_results = analyze_email_file(args.file)
    failed_reasons = []

    # --- Print a Detailed, Colored Report ---
    print(f"\n{Colors.BOLD}--- ANALYSIS REPORT: {os.path.basename(args.file)} ---{Colors.END}\n")

    if 'error' in analysis_results:
        print_colored_output("Error", analysis_results['error'], Colors.RED)
        return

    # 1. Sender and Authentication
    print(f"{Colors.BOLD}1. Sender and Authentication{Colors.END}")
    if analysis_results.get('sender_analysis', {}).get('ip'):
        ip = analysis_results['sender_analysis']['ip']
        ip_rep = analysis_results['sender_analysis']['ip_reputation']
        loc = analysis_results['sender_analysis']['ip_location']
        
        rep_color = Colors.GREEN
        if ip_rep['level'] == 'CRITICAL': 
            rep_color = Colors.RED
            failed_reasons.append(f"IP Reputation: {ip_rep['details']}")
        elif ip_rep['level'] == 'HIGH': 
            rep_color = Colors.YELLOW
            failed_reasons.append(f"IP Reputation: {ip_rep['details']}")
        elif ip_rep['level'] == 'MEDIUM': rep_color = Colors.CYAN
        
        print_colored_output("Sender IP", f"{ip} ({loc})", rep_color)
    
    auth_results = analysis_results['sender_analysis']
    if auth_results['spf'] == 'fail': 
        print_colored_output("SPF", "FAIL", Colors.RED)
        failed_reasons.append("SPF Failure: The sender's server IP is not authorized to send mail for the domain.")
    else: 
        print_colored_output("SPF", auth_results['spf'].upper(), Colors.GREEN)
    
    if auth_results['dkim'] == 'fail': 
        print_colored_output("DKIM", "FAIL", Colors.RED)
        failed_reasons.append("DKIM Failure: The email's digital signature is invalid or missing, indicating it may have been tampered with or forged.")
    else:
        print_colored_output("DKIM", auth_results['dkim'].upper(), Colors.GREEN)
    
    if auth_results['dmarc'] == 'fail': 
        print_colored_output("DMARC", "FAIL", Colors.RED)
        failed_reasons.append("DMARC Failure: The sender's domain did not align with the authentication records, a strong indicator of a spoofed email.")
    else:
        print_colored_output("DMARC", auth_results['dmarc'].upper(), Colors.GREEN)

    # 2. Anomaly Detection
    print(f"\n{Colors.BOLD}2. Anomaly Detection{Colors.END}")
    anomalies = analysis_results.get('anomaly_detection', {})
    if anomalies:
        for key, value in anomalies.items():
            print_colored_output(f"{key.replace('_', ' ').capitalize()}", "DETECTED", Colors.YELLOW)
            if key == 'impersonation':
                failed_reasons.append("Sender Impersonation: The display name is from a trusted domain, but the email address is not.")
            elif key == 'message_id':
                failed_reasons.append("Message-ID Anomaly: The message ID has an unusual length, which is common in machine-generated spam.")
    else:
        print("  No major anomalies detected.")

    # 3. Final Report Summary
    print(f"\n{Colors.BOLD}3. Summary of Findings{Colors.END}")
    if failed_reasons:
        print_colored_output("Status", "WARNING", Colors.RED)
        print("\nThis email is suspicious for the following reasons:")
        for reason in failed_reasons:
            print(f"- {reason}")
    else:
        print_colored_output("Status", "SAFE", Colors.GREEN)
        print("\nThis email appears to be safe based on header analysis.")
    
    print(f"\n{Colors.BOLD}--- END OF REPORT ---{Colors.END}\n")

if __name__ == "__main__":
    main()
