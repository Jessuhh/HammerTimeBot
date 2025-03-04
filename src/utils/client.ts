import { Client, InteractionType } from 'discord.js';
import { i18n } from 'i18next';
import { env } from '../env.js';
import { getGitData } from './get-git-data.js';
import { handleCommandAutocomplete, handleCommandInteraction } from './interaction-handlers.js';
import { GatewayIntentBits } from 'discord-api-types/v10';
import {
  cleanGlobalCommands,
  getAuthorizedServers,
  updateGlobalCommands,
  updateGuildCommands,
} from './update-guild-commands.js';

const updateCommands = async (i18next: i18n) => {
  const t = i18next.t.bind(i18next);
  console.log(`Application ${env.LOCAL ? 'is' : 'is NOT'} in local mode`);
  if (env.LOCAL) {
    const serverIds = await getAuthorizedServers();
    await cleanGlobalCommands();
    await Promise.all(serverIds.map((serverId) => updateGuildCommands(serverId, t)));
  } else {
    await updateGlobalCommands(t);
  }
};

const handleReady = (i18next: i18n) => async (client: Client<true>) => {
  const clientUser = client.user;
  if (!clientUser) throw new Error('Expected `client.user` to be defined');
  console.log(`Logged in as ${clientUser.tag}!`);

  const versionString = env.LOCAL ? 'a local version' : await getGitData()
    .then(({ hash }) => `version ${hash}`)
    .catch(() => 'an unknown version');
  clientUser.setActivity(versionString);

  const shardIds = client.shard?.ids;
  if (shardIds) {
    console.log(`# Shard ${shardIds.join(', ')}`);

    if (shardIds.includes(0)) {
      console.log('Shard 0 is updating commands');
      await updateCommands(i18next);
    }
  }
};

export const createClient = async (i18next: i18n): Promise<void> => {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on('ready', handleReady(i18next));

  client.on('interactionCreate', async (interaction) => {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        await handleCommandInteraction(interaction, i18next);
        return;
      case InteractionType.ApplicationCommandAutocomplete:
        await handleCommandAutocomplete(interaction, i18next);
        return;
      default:
        throw new Error(`Unhandled interaction of type ${interaction.type}`);
    }

  });

  await client.login();
};
