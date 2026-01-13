import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, AlertTriangle, XCircle, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ReactNode } from 'react';

interface ResultsSectionProps {
  report: string;
  isAnalyzing: boolean;
}

export default function ResultsSection({ report, isAnalyzing }: ResultsSectionProps) {
  const parseColoredOutput = (text: string) => {
    // Parse ANSI color codes and convert to HTML
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let className = 'text-foreground';
      let icon: ReactNode = null;
      
      // Detect color patterns (simplified - in real implementation, parse ANSI codes)
      if (line.includes('✓') || line.toLowerCase().includes('pass') || line.toLowerCase().includes('success')) {
        className = 'text-green-600 dark:text-green-400';
        icon = <CheckCircle2 className="h-4 w-4 inline mr-2" />;
      } else if (line.includes('⚠') || line.toLowerCase().includes('warning') || line.toLowerCase().includes('suspicious')) {
        className = 'text-yellow-600 dark:text-yellow-400';
        icon = <AlertTriangle className="h-4 w-4 inline mr-2" />;
      } else if (line.includes('✗') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('error') || line.toLowerCase().includes('danger')) {
        className = 'text-red-600 dark:text-red-400';
        icon = <XCircle className="h-4 w-4 inline mr-2" />;
      }
      
      return (
        <div key={index} className={`${className} font-mono text-sm leading-relaxed`}>
          {icon}
          {line || '\u00A0'}
        </div>
      );
    });
  };

  return (
    <Card className="border-2 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isAnalyzing ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="p-6 bg-card">
              <div className="bg-muted/30 rounded-lg p-6 border border-border/50">
                {parseColoredOutput(report)}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
