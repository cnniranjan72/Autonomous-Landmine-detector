import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

export interface LogEntry {
  id: string;
  timestamp: string;
  lat: number;
  lng: number;
  prediction: "mine" | "clear";
  confidence: number;
  model: string;
}

interface PredictionLogProps {
  entries: LogEntry[];
}

export const PredictionLog = ({ entries }: PredictionLogProps) => {
  return (
    <Card className="border-2 border-primary/30">
      <div className="border-b border-border p-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-wider">Detection Log</h2>
        <Badge variant="secondary" className="ml-auto font-mono">
          {entries.length} Records
        </Badge>
      </div>
      <ScrollArea className="h-[300px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase">Timestamp</TableHead>
              <TableHead className="text-xs uppercase">Location</TableHead>
              <TableHead className="text-xs uppercase">Status</TableHead>
              <TableHead className="text-xs uppercase text-right">Confidence</TableHead>
              <TableHead className="text-xs uppercase">Model</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No detection records yet. Start scanning to begin logging.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id} className="font-mono text-xs">
                  <TableCell className="whitespace-nowrap">{entry.timestamp}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {entry.lat.toFixed(4)}°N, {Math.abs(entry.lng).toFixed(4)}°W
                  </TableCell>
                  <TableCell>
                    {entry.prediction === "mine" ? (
                      <Badge variant="destructive" className="font-bold">
                        MINE
                      </Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground">
                        CLEAR
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {entry.confidence.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {entry.model}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
};
