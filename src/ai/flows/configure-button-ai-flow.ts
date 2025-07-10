/** 
'use server';
/**
 * @fileOverview A Genkit flow to configure a button based on a natural language prompt.
 *
 * - configureButtonWithAI - A function that takes a user prompt and returns a suggested ButtonConfig.
 * - ConfigureButtonAIInput - The input type for the configureButtonWithAI function.
 * - ConfigureButtonAIOutput - The return type for the configureButtonWithAI function (ButtonConfig).
 */
/** 
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { IconName } from '@/lib/icons';
import { iconList } from '@/lib/icons';
import type { ButtonActionType } from '@/lib/types';
import { ALL_ACTION_TYPES } from '@/lib/types';

// Zod schema for the input to this flow
const ConfigureButtonAIInputSchema = z.object({
  prompt: z.string().describe('The natural language prompt describing the desired button configuration.'),
});
export type ConfigureButtonAIInput = z.infer<typeof ConfigureButtonAIInputSchema>;

// Zod schema for the output (ButtonConfig)
const AiButtonConfigOutputSchema = z.object({
  label: z.string().describe("The text label for the button. Should be concise."),
  iconName: z.custom<IconName>((val) => iconList.includes(val as IconName), {
    message: `Invalid icon. Must be one of: ${iconList.join(', ')}`
  }).optional().describe(`The name of a Lucide icon. If an icon is requested, choose the most appropriate one from this list: ${iconList.join(', ')}. If no specific icon is implied or requested, this can be omitted.`),
  action: z.object({
    type: z.custom<ButtonActionType>((val) => ALL_ACTION_TYPES.includes(val as ButtonActionType), {
        message: `Invalid action type. Must be one of: ${ALL_ACTION_TYPES.join(', ')}`
    }).describe(`The type of action the button performs. Choose one from: ${ALL_ACTION_TYPES.join(', ')}. Default to 'none' or 'open_url' if a website is implied.`),
    value: z.string().describe("The value for the action (e.g., a URL for 'open_url', an application name for 'system_open_app', a command for 'run_script', a hotkey combination like 'Ctrl+Shift+P' for 'hotkey'). This should be specific and usable."),
  }),
  backgroundColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Must be a valid hex color code (e.g., #RRGGBB or #RGB).").optional().describe("A hex color code for the button background, if specified or implied by the prompt (e.g., 'a red button'). Omit if not specified."),
  textColor: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "Must be a valid hex color code (e.g., #RRGGBB or #RGB).").optional().describe("A hex color code for the button's text and icon, if specified or implied. Omit if not specified."),
});
export type ConfigureButtonAIOutput = z.infer<typeof AiButtonConfigOutputSchema>;


export async function configureButtonWithAI(input: ConfigureButtonAIInput): Promise<ConfigureButtonAIOutput> {
  return configureButtonAIFlow(input);
}

const configureButtonGenkitPrompt = ai.definePrompt({
  name: 'configureButtonPrompt',
  input: {schema: ConfigureButtonAIInputSchema},
  output: {schema: AiButtonConfigOutputSchema},
  prompt: `You are an AI assistant that helps configure buttons for a device control application called "Weel".
Your goal is to translate a user's natural language prompt into a valid JSON configuration for a button.

User's request: "{{{prompt}}}"

Consider the following when generating the configuration:
- Label: Extract or infer a concise label for the button. Make it short, ideally one or two words.
- Icon: If the user mentions an icon, or if an icon is strongly implied by the action (e.g., "website" might imply a 'Globe' icon, "Discord" might imply 'MessageCircle', "YouTube" might imply 'Youtube'), select the *exact* name of the most appropriate icon from the provided list. If multiple icons could fit, pick the most common or generic one. If no icon is mentioned or clearly implied, omit 'iconName'.
- Action Type: Determine the most suitable action type from the provided list. If a website is mentioned (e.g., "youtube.com", "Google"), default to 'open_url'. If an application name is mentioned (e.g. "Discord", "Spotify", "VS Code"), default to 'system_open_app'. If it's unclear, default to 'none'.
- Action Value: Determine the specific value for the action. For example:
    - For 'open_url' or 'system_website', this should be a full URL (e.g., "https://www.youtube.com"). If the user just says 'YouTube', use 'https://www.youtube.com'. For 'Google', use 'https://www.google.com'.
    - For 'hotkey' or 'system_hotkey', it should be a key combination (e.g., "Ctrl+C", "Alt+F4").
    - For 'run_script', it could be a command or script name (e.g., "toggle_mute.sh").
    - For 'system_open_app', the application name (e.g., "Spotify", "Notepad", "Discord", "Visual Studio Code"). Be precise with application names if known.
    - For 'system_text', the text to be typed.
    - If the action type is 'none', the value should typically be an empty string.
- Colors: If the user specifies colors (e.g., "a blue button with white text"), provide them as hex codes. Otherwise, omit 'backgroundColor' and 'textColor'.

Available Icons: ${iconList.join(', ')}
Available Action Types: ${ALL_ACTION_TYPES.join(', ')}

Respond ONLY with the JSON configuration object. Do not include any explanations or surrounding text.
The JSON should conform to this structure:
{
  "label": "string",
  "iconName": "string (optional, from list)",
  "action": {
    "type": "string (from list)",
    "value": "string"
  },
  "backgroundColor": "string (hex, optional)",
  "textColor": "string (hex, optional)"
}
`,
});

const configureButtonAIFlow = ai.defineFlow(
  {
    name: 'configureButtonAIFlow',
    inputSchema: ConfigureButtonAIInputSchema,
    outputSchema: AiButtonConfigOutputSchema,
  },
  async (input: ConfigureButtonAIInput) => {
    console.log('configureButtonAIFlow received input:', JSON.stringify(input, null, 2));
    try {
      const {output} = await configureButtonGenkitPrompt(input);
      if (!output) {
        console.warn('AI button configuration prompt returned no output. Input:', input);
        throw new Error('The AI could not generate a button configuration for your prompt. Please try rephrasing.');
      }

      // Validate and potentially correct iconName
      if (output.iconName && !iconList.includes(output.iconName as IconName)) {
        console.warn(`AI generated an invalid iconName: ${output.iconName}. Attempting to find a similar or setting to undefined.`);
        // Attempt case-insensitive match
        const similarIcon = iconList.find(icon => icon.toLowerCase() === (output.iconName as string).toLowerCase());
        if (similarIcon) {
          output.iconName = similarIcon;
        } else {
          // If no similar icon, and it's not a valid one, set to undefined
          output.iconName = undefined;
        }
      }

      // Ensure actionType is valid and default if necessary
      if (!output.action || !ALL_ACTION_TYPES.includes(output.action.type as ButtonActionType)) {
         console.warn(`AI generated an invalid or missing actionType: ${output.action?.type}. Defaulting to 'none'.`);
         output.action = { type: 'none', value: output.action?.value || '' };
      }

      // Ensure value is empty string for 'none' action type if AI forgets
      if (output.action.type === 'none' && output.action.value === undefined) {
        output.action.value = '';
      }

      // For common 'open_url' actions, ensure value is a full URL
      if (output.action.type === 'open_url' && output.action.value) {
        const lowerValue = output.action.value.toLowerCase();
        if (lowerValue === 'youtube') output.action.value = 'https://www.youtube.com';
        else if (lowerValue === 'google') output.action.value = 'https://www.google.com';
        else if (lowerValue === 'discord') output.action.value = 'https://www.discord.com';
        else if (lowerValue === 'twitch') output.action.value = 'https://www.twitch.tv';
        else if (lowerValue === 'github') output.action.value = 'https://www.github.com';
        else if (lowerValue === 'twitter' || lowerValue === 'x') output.action.value = 'https://www.x.com';
        else if (!output.action.value.startsWith('http://') && !output.action.value.startsWith('https://')) {
            // Basic check if it looks like a domain, then prepend https://
            // This is a simple heuristic and might not cover all cases (e.g. localhost, IP addresses)
            if (output.action.value.includes('.') && !output.action.value.includes(' ')) {
                output.action.value = `https://${output.action.value}`;
            }
        }
      }

      // If action type is system_open_app, and icon is not set, try to infer common app icons
      if (output.action.type === 'system_open_app' && !output.iconName && output.action.value) {
        const appNameLower = output.action.value.toLowerCase();
        if (appNameLower.includes('code') || appNameLower.includes('visual studio')) output.iconName = 'Code';
        else if (appNameLower.includes('discord')) output.iconName = 'MessageCircle';
        else if (appNameLower.includes('spotify')) output.iconName = 'PlaySquare'; // Or other music icon
        else if (appNameLower.includes('chrome') || appNameLower.includes('firefox') || appNameLower.includes('safari') || appNameLower.includes('edge') ) output.iconName = 'Globe';
        else if (appNameLower.includes('terminal') || appNameLower.includes('iterm') || appNameLower.includes('powershell') || appNameLower.includes('cmd')) output.iconName = 'TerminalSquare';
        // Add more inferences as needed
      }


      return output;
    } catch (error) {
      console.error('Error in configureButtonAIFlow. Input:', JSON.stringify(input, null, 2), 'Error:', error);
      if (error instanceof z.ZodError) {
        throw new Error(`The AI's response did not match the expected format. Details: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      if (error instanceof Error) {
        throw error; // Re-throw the original error to get its message in the UI
      }
      throw new Error('Failed to generate button configuration from the AI model. Please try again later or rephrase your prompt.');
    }
  }
);

*/
