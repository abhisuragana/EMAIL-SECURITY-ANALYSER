# Email File Analysis Application

## Overview
A web application that allows users to upload email files (.eml or .msg format) and analyze them using existing Python logic to generate detailed security reports.

## Core Features

### File Upload Interface
- Drag-and-drop upload area for email files
- File selector button as alternative upload method
- Support for .eml and .msg file formats only
- File validation to ensure correct format before upload

### Analysis Processing
- "Run Analysis" button to trigger the analysis process
- Backend executes the existing Python script without modification
- Process uploaded email files server-side using the provided Python logic
- Capture complete console output from the Python script execution

### Results Display
- Output display area showing the full analysis report
- Preserve colored terminal output (red, yellow, green color coding)
- Display results as formatted text maintaining visual color cues
- Clear separation between upload interface and results section

## Backend Requirements
- Store uploaded email files temporarily for analysis
- Execute existing Python script server-side without alterations
- Capture and return complete console output including color formatting
- Handle file processing and script execution errors gracefully

## User Interface Layout
- Clean, simple interface with three main sections:
  1. File upload area (drag-and-drop + file selector)
  2. Analysis trigger button
  3. Results display area below

## Technical Notes
- Application language: English
- Preserve existing Python logic exactly as provided
- Maintain colored terminal output formatting in web display
- Handle both .eml and .msg email file formats
