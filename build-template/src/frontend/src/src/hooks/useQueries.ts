import { useMutation } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';

export function useAnalyzeEmail() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (file: File): Promise<string> => {
      if (!actor) {
        throw new Error('Backend actor not initialized');
      }

      // Convert file to Uint8Array
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create ExternalBlob and upload
      const blob = ExternalBlob.fromBytes(uint8Array);
      
      // Store the file in the backend
      await actor.storeFile(blob);

      // Simulate analysis (in real implementation, backend would process and return results)
      // For now, return a mock colored report
      return generateMockReport(file.name);
    },
  });
}

// Mock report generator (to be replaced with actual backend analysis)
function generateMockReport(fileName: string): string {
  return `
═══════════════════════════════════════════════════════════════
                    EMAIL SECURITY ANALYSIS REPORT
═══════════════════════════════════════════════════════════════

File: ${fileName}
Analysis Date: ${new Date().toLocaleString()}

─────────────────────────────────────────────────────────────

HEADER ANALYSIS
─────────────────────────────────────────────────────────────
✓ SPF Check: PASS
  └─ Sender Policy Framework validation successful

✓ DKIM Signature: PASS
  └─ DomainKeys Identified Mail signature verified

⚠ DMARC Policy: WARNING
  └─ Domain-based Message Authentication policy found but not enforced

✓ Return-Path: PASS
  └─ Return path matches sender domain

─────────────────────────────────────────────────────────────

SENDER VERIFICATION
─────────────────────────────────────────────────────────────
✓ From Address: PASS
  └─ Sender address format is valid

✓ Reply-To: PASS
  └─ Reply-to address matches sender domain

✓ Message-ID: PASS
  └─ Message ID format is valid

─────────────────────────────────────────────────────────────

CONTENT ANALYSIS
─────────────────────────────────────────────────────────────
✓ Suspicious Links: PASS
  └─ No suspicious URLs detected

⚠ Attachment Analysis: WARNING
  └─ Email contains executable attachments - exercise caution

✓ Phishing Indicators: PASS
  └─ No common phishing patterns detected

─────────────────────────────────────────────────────────────

SECURITY SCORE
─────────────────────────────────────────────────────────────
Overall Score: 85/100 (GOOD)

✓ Email appears legitimate
⚠ Minor security concerns detected
  └─ Review attachment before opening

─────────────────────────────────────────────────────────────

RECOMMENDATIONS
─────────────────────────────────────────────────────────────
• Verify sender identity before responding
• Scan attachments with antivirus software
• Do not click links without verifying destination
• Report suspicious emails to IT security

═══════════════════════════════════════════════════════════════
                        END OF REPORT
═══════════════════════════════════════════════════════════════
`;
}
