/** 
// Implemented Genkit flow for suggesting smart actions based on running applications.

'use server';

/**
 * @fileOverview This file defines a Genkit flow that suggests smart command sequences
 * based on the user's currently running applications. It provides AI-driven suggestions
 * to help users quickly set up context-aware actions for their Weel device.
 *
 * @exports suggestSmartActions - An asynchronous function that takes an array of running application names as input and returns
 *                                 an array of suggested command sequences tailored to those applications.
 * @exports SuggestSmartActionsInput - The input type for the suggestSmartActions function, an array of application names.
 * @exports SuggestSmartActionsOutput - The output type for the suggestSmartActions function, an array of suggested command sequences.
 */

/**
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSmartActionsInputSchema = z.object({
  runningApplications: z
    .array(z.string())
    .describe('An array of the names of the currently running applications.'),
});
export type SuggestSmartActionsInput = z.infer<typeof SuggestSmartActionsInputSchema>;

const SuggestSmartActionsOutputSchema = z.array(z.object({
  applicationName: z.string().describe('The name of the application for which the command is suggested, matching one of the input applications.'),
  commandSequence: z.string().describe('A suggested command sequence, hotkey, or app-specific function for the application.'),
}));

export type SuggestSmartActionsOutput = z.infer<typeof SuggestSmartActionsOutputSchema>;

export async function suggestSmartActions(input: SuggestSmartActionsInput): Promise<SuggestSmartActionsOutput> {
  return suggestSmartActionsFlow(input);
}

const suggestSmartActionsPrompt = ai.definePrompt({
  name: 'suggestSmartActionsPrompt',
  input: {schema: SuggestSmartActionsInputSchema},
  output: {schema: SuggestSmartActionsOutputSchema},
  prompt: `You are an AI assistant for "Weel", a customizable macro pad device.
Your task is to suggest useful actions (command sequences, hotkeys, or app-specific functions) that a user might want to map to a Weel button, based on their currently running applications.

Your response MUST be a JSON array of objects. Each object in the array MUST have two keys:
1.  "applicationName": A string, exactly matching one of the input application names.
2.  "commandSequence": A string, describing a single suggested action for that application.

For EACH application in the input list (Running Applications):
- You MUST generate AT LEAST TWO (2) and preferably THREE (3) separate suggestion objects.
- Each suggestion object should describe a DIFFERENT action for that application.
- Do NOT combine multiple suggestions for the same app into a single "commandSequence" string. Each action must be its own object in the array.

Running Applications:
{{#each runningApplications}}
- {{this}}
{{/each}}

Think about common tasks, useful shortcuts, or specific features for each listed application. Focus on actions that are frequently used or save time.

For example, if the input is: ["Spotify", "VS Code"]
Your output MUST be a JSON array structured EXACTLY like this:
[
  { "applicationName": "Spotify", "commandSequence": "Play/Pause current track" },
  { "applicationName": "Spotify", "commandSequence": "Skip to next track" },
  { "applicationName": "Spotify", "commandSequence": "Like current song" },
  { "applicationName": "VS Code", "commandSequence": "Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)" },
  { "applicationName": "VS Code", "commandSequence": "Toggle Sidebar Visibility" },
  { "applicationName": "VS Code", "commandSequence": "Format Document" }
]

Another example, if the input is: ["Google Chrome"]
Your output MUST be a JSON array structured EXACTLY like this:
[
  { "applicationName": "Google Chrome", "commandSequence": "New Tab (Ctrl+T or Cmd+T)"},
  { "applicationName": "Google Chrome", "commandSequence": "New Incognito Window (Ctrl+Shift+N or Cmd+Shift+N)"},
  { "applicationName": "Google Chrome", "commandSequence": "Close Current Tab (Ctrl+W or Cmd+W)"}
]

If you cannot find at least two relevant suggestions for a specific application, provide as many distinct suggestions as you can (minimum one, but aim for more).
If no relevant actions can be suggested for ANY of the listed applications, return an empty array.
`,
});

const suggestSmartActionsFlow = ai.defineFlow(
  {
    name: 'suggestSmartActionsFlow',
    inputSchema: SuggestSmartActionsInputSchema,
    outputSchema: SuggestSmartActionsOutputSchema,
  },
  async input => {
    try {
      // Filter out empty application names before sending to the AI
      const filteredInput = {
        runningApplications: input.runningApplications.filter(app => app.trim() !== '')
      };

      if (filteredInput.runningApplications.length === 0) {
        console.log('No valid applications provided to suggestSmartActionsFlow.');
        return []; // Return empty if no valid apps after filtering
      }

      const {output} = await suggestSmartActionsPrompt(filteredInput);
      // If the model returns no output or if it doesn't match the schema (though Genkit usually throws for schema mismatch),
      // we should return an empty array.
      if (!output) {
        console.warn('Smart actions prompt returned no output or failed validation. Input:', filteredInput);
        return [];
      }
      // Ensure the output only contains suggestions for the requested applications
      const validAppNames = new Set(filteredInput.runningApplications.map(app => app.toLowerCase()));
      const validatedOutput = output.filter(suggestion => validAppNames.has(suggestion.applicationName.toLowerCase()));
      
      return validatedOutput;

    } catch (error) {
      console.error('Error in suggestSmartActionsFlow while calling prompt. Input:', input, 'Error:', error);
      // Rethrow a new error to be caught by the calling UI component,
      // which will then display a user-friendly toast message.
      throw new Error('Failed to generate smart action suggestions from the AI model. Please try again later.');
    }
  }
);
*/
    