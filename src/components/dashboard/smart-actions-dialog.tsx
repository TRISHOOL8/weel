
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suggestSmartActions, type SuggestSmartActionsInput, type SuggestSmartActionsOutput } from "@/ai/flows/suggest-smart-actions";
import { configureButtonWithAI, type ConfigureButtonAIInput, type ConfigureButtonAIOutput } from "@/ai/flows/configure-button-ai-flow";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, Bot } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


interface SmartActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAIConfigurationResult: (config: ConfigureButtonAIOutput) => void;
}

export function SmartActionsDialog({ isOpen, onOpenChange, onAIConfigurationResult }: SmartActionsDialogProps) {
  const [runningApps, setRunningApps] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestSmartActionsOutput>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [didAttemptSuggestions, setDidAttemptSuggestions] = useState(false);
  
  const [aiButtonPrompt, setAiButtonPrompt] = useState("");
  const [aiButtonConfig, setAiButtonConfig] = useState<ConfigureButtonAIOutput | null>(null);
  const [isLoadingAiButtonConfig, setIsLoadingAiButtonConfig] = useState(false);
  const [didAttemptAiButtonConfig, setDidAttemptAiButtonConfig] = useState(false);


  const { toast } = useToast();

  const handleSuggestActionsSubmit = async () => {
    if (!runningApps.trim()) {
      toast({
        title: "Input Required",
        description: "Please list some running applications.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSuggestions(true);
    setSuggestions([]);
    setDidAttemptSuggestions(false);
    try {
      const appsArray = runningApps.split(',').map(app => app.trim()).filter(app => app);
      const input: SuggestSmartActionsInput = { runningApplications: appsArray };
      const result = await suggestSmartActions(input);
      setSuggestions(result);
      if (result.length === 0) {
        toast({
          title: "No Suggestions",
          description: "AI couldn't find specific suggestions for these apps. Try being more specific or check for typos.",
        });
      }
    } catch (error) {
      console.error("Error fetching smart actions:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to get smart actions. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
      setDidAttemptSuggestions(true);
    }
  };

  const handleConfigureButtonWithAISubmit = async () => {
    if (!aiButtonPrompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a prompt to configure the button.",
        variant: "destructive",
      });
      return;
    }
    setIsLoadingAiButtonConfig(true);
    setAiButtonConfig(null); 
    setDidAttemptAiButtonConfig(false);
    try {
      const input: ConfigureButtonAIInput = { prompt: aiButtonPrompt };
      const result = await configureButtonWithAI(input);
      
      setAiButtonConfig(result); 

      if (result) {
        onAIConfigurationResult(result); 
      } else {
         toast({
          title: "AI Task Note",
          description: "The AI did not return a configuration. Please try rephrasing your prompt.",
          variant: "destructive" 
        });
      }

    } catch (error) {
      console.error("Error configuring button with AI:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate button configuration. Please try again.";
      toast({
        title: "AI Task Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAiButtonConfig(false);
      setDidAttemptAiButtonConfig(true);
    }
  };

  const handleOpenChangeWithReset = (open: boolean) => {
    if (!open) {
      setRunningApps("");
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setDidAttemptSuggestions(false);
      setAiButtonPrompt("");
      setAiButtonConfig(null);
      setIsLoadingAiButtonConfig(false);
      setDidAttemptAiButtonConfig(false);
    }
    onOpenChange(open); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChangeWithReset}>
      <DialogContent className="sm:max-w-2xl w-[90vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle className="flex items-center">
            <Wand2 className="mr-2 h-6 w-6 text-primary" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Leverage AI to get command suggestions or configure buttons from prompts.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="suggest-actions" className="flex-grow flex flex-col min-h-0 px-6">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="suggest-actions">Smart Suggestions</TabsTrigger>
            <TabsTrigger value="configure-button">Configure & Add</TabsTrigger>
          </TabsList>

          <TabsContent value="suggest-actions" className="flex-grow flex flex-col overflow-hidden mt-2 p-0">
            <div className="space-y-4 shrink-0 p-4">
              <div className="grid gap-2">
                <Label htmlFor="running-apps">Running Applications</Label>
                <Textarea
                  id="running-apps"
                  placeholder="e.g., VS Code, Spotify, Google Chrome"
                  value={runningApps}
                  onChange={(e) => setRunningApps(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              <Button onClick={handleSuggestActionsSubmit} disabled={isLoadingSuggestions} className="w-full sm:w-auto">
                {isLoadingSuggestions ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Suggest Actions
              </Button>
            </div>
            
            {/* Container for the suggestions list and its states */}
            <div className="flex-grow flex flex-col min-h-0 mt-1 pb-4"> {/* Added pb-4 for some bottom padding inside this container */}
              {isLoadingSuggestions && (
                <div className="flex-grow flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
              {!isLoadingSuggestions && didAttemptSuggestions && suggestions.length === 0 && (
                 <div className="flex-grow flex items-center justify-center">
                  <p className="text-muted-foreground text-center">No suggestions found for the provided applications. <br/>Try being more specific or check for typos.</p>
                </div>
              )}
              {!isLoadingSuggestions && suggestions.length > 0 && (
                <ScrollArea className="h-[300px] border rounded-md overflow-y-auto scrollbar">
 {/* flex-1 and min-h-0 are key for scrolling */}
                  <div className="p-3 space-y-3">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Suggested Actions:</h3>
                    {suggestions.map((suggestion, index) => (
                      <Card key={index} className="bg-card/50">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{suggestion.applicationName}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2">
                         <CardDescription className="text-sm text-muted-foreground">
                          {suggestion.commandSequence}
                        </CardDescription>
                         <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const config: ConfigureButtonAIOutput = {
                              label: suggestion.applicationName,
                              iconName: "Zap", // You can make this smarter later
                              action: {
                                type: "shell", // or "hotkey", depending on your system
                                value: suggestion.commandSequence
                              },
                            
                              textColor: "#FFFFFF"
                            };
                            onAIConfigurationResult(config);
                          }}
                        >
                          Add to Grid
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          {/* Configure Button Tab Content */}
          <TabsContent value="configure-button" className="flex-grow flex flex-col overflow-hidden mt-2 p-0">
             <div className="space-y-4 shrink-0 p-4">
              <div className="grid gap-2">
                <Label htmlFor="ai-button-prompt">Describe your button</Label>
                <Textarea
                  id="ai-button-prompt"
                  placeholder="e.g., 'Create a blue button with a play icon that opens youtube.com' or 'Button to mute Discord using Ctrl+Shift+M'"
                  value={aiButtonPrompt}
                  onChange={(e) => setAiButtonPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={handleConfigureButtonWithAISubmit} disabled={isLoadingAiButtonConfig} className="w-full sm:w-auto">
                {isLoadingAiButtonConfig ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="mr-2 h-4 w-4" />
                )}
                Generate & Add to Grid
              </Button>
            </div>

            {/* Container for AI generated button preview */}
            <div className="flex-grow flex flex-col min-h-0 mt-1 pb-4"> {/* Added pb-4 */}
              {isLoadingAiButtonConfig && (
                 <div className="flex-grow flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
              )}
              {!isLoadingAiButtonConfig && didAttemptAiButtonConfig && !aiButtonConfig && (
                <div className="flex-grow flex items-center justify-center">
                  <p className="text-muted-foreground text-center">AI could not generate a configuration. <br/>Try rephrasing your prompt or check for errors.</p>
                </div>
              )}
              {!isLoadingAiButtonConfig && aiButtonConfig && (
                <div className="space-y-3 flex-grow min-h-0"> {/* Ensure this container allows ScrollArea to establish its height */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 px-4">AI Generated Configuration Preview:</h3>
                  <ScrollArea className="flex-1 min-h-0"> {/* flex-1 and min-h-0 for scrolling */}
                    <div className="px-4"> {/* Added padding here instead of on the card itself for better scroll content flow */}
                      <Card className="bg-card/50">
                        <CardContent className="p-4 text-sm space-y-1">
                          <div><strong>Label:</strong> {aiButtonConfig.label || <span className="text-muted-foreground italic">Not specified</span>}</div>
                          {aiButtonConfig.iconName && <div><strong>Icon:</strong> <Badge variant="secondary">{aiButtonConfig.iconName}</Badge></div>}
                          <div><strong>Action Type:</strong> <Badge variant="outline">{aiButtonConfig.action?.type || "None"}</Badge></div>
                          <div><strong>Action Value:</strong> {aiButtonConfig.action?.value || <span className="text-muted-foreground italic">Not specified</span>}</div>
                          {aiButtonConfig.backgroundColor && (
                            <div>
                              <strong>Background:</strong>{' '}
                              <span style={{ color: aiButtonConfig.backgroundColor }} className="font-semibold">
                                {aiButtonConfig.backgroundColor}
                              </span>{' '}
                              <span
                                className="inline-block w-4 h-4 rounded border align-middle"
                                style={{ backgroundColor: aiButtonConfig.backgroundColor }}
                              ></span>
                            </div>
                          )}
                          {aiButtonConfig.textColor && (
                            <div>
                              <strong>Text Color:</strong>{' '}
                              <span style={{ color: aiButtonConfig.textColor }} className="font-semibold">
                                {aiButtonConfig.textColor}
                              </span>{' '}
                              <span
                                className="inline-block w-4 h-4 rounded border align-middle p-0.5"
                                style={{
                                  backgroundColor: 'hsl(var(--muted))', 
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: aiButtonConfig.textColor, 
                                }}
                              >
                                 Aa
                              </span>
                            </div>
                          )}
                          
                          <details className="mt-3 pt-2 border-t">
                            <summary className="cursor-pointer text-xs hover:underline text-muted-foreground">View Raw JSON</summary>
                            <pre className="mt-2 p-2 bg-muted/50 rounded-md text-xs overflow-x-auto">
                              {JSON.stringify(aiButtonConfig, null, 2)}
                            </pre>
                          </details>
                          <p className="mt-3 text-xs text-muted-foreground">
                            The AI attempted to add this configuration to your grid. Check notifications for the result. If the dialog did not close, the grid might be full, no profile was active, or an error occurred.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-auto pt-4 pb-6 px-6 border-t bg-background shrink-0">
          <Button variant="outline" onClick={() => handleOpenChangeWithReset(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
    
    