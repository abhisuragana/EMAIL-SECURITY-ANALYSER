import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAnalyzeEmail } from '@/hooks/useQueries';

interface UploadSectionProps {
  onAnalysisComplete: (report: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export default function UploadSection({ onAnalysisComplete, isAnalyzing, setIsAnalyzing }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeEmailMutation = useAnalyzeEmail();

  const validateFile = (file: File): boolean => {
    const validExtensions = ['.eml', '.msg'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      setError('Invalid file type. Please upload a .eml or .msg file.');
      return false;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File is too large. Maximum size is 50MB.');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      toast.success('File selected successfully');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const result = await analyzeEmailMutation.mutateAsync(selectedFile);
      onAnalysisComplete(result);
      toast.success('Analysis completed successfully');
    } catch (err) {
      toast.error('Analysis failed. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardContent className="p-6 md:p-8">
        <div className="space-y-6">
          <div
            className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
              dragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:bg-accent/5'
            } ${selectedFile ? 'bg-accent/10' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".eml,.msg"
              onChange={handleChange}
              disabled={isAnalyzing}
            />
            
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center py-12 px-6 cursor-pointer"
            >
              {selectedFile ? (
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Click to change file or drag and drop a new one
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Drop your email file here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports .eml and .msg files (max 50MB)
                  </p>
                </div>
              )}
            </label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Email...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
