import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';

export default function (pi: ExtensionAPI) {
  pi.on('tool_call', async (event) => {
    if (event.toolName !== 'bash') return undefined;

    const command = event.input.command as string;
    if (command.includes('git commit') && command.includes('--amend')) {
      return { block: true, reason: 'git commit --amend is explicitly disabled by user policy.' };
    }

    return undefined;
  });
}
