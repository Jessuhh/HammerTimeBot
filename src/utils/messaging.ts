import {
  ApplicationCommandOptionType,
  ChannelType,
  ChatInputCommandInteraction,
  CommandInteraction,
  CommandInteractionOption,
  User,
} from 'discord.js';
import { GlobalCommandOptionName } from '../types/localization.js';

export const getUserIdentifier = (user: User): `${string}#${string} (${string})` => `${user.username}#${user.discriminator} (${user.id})`;

export const stringifyChannelName = (channel: CommandInteraction['channel']): string => {
  if (channel) {
    let stringName: string;
    if (channel.type === ChannelType.GuildText && 'name' in channel) {
      stringName = `#${channel.name}`;
    } else {
      stringName = channel.toString();
    }

    return `${stringName} (${channel.id})`;
  }

  return '(unknown channel)';
};

export const stringifyGuildName = (guild: CommandInteraction['guild']): string => {
  if (guild) {
    return `${guild.name} (${guild.id})`;
  }

  return '(unknown guild)';
};

export const stringifyOptionsData = (data: readonly CommandInteractionOption[]): string => data.map((option): string => {
  const optionName = option.name;
  let optionValue: string | number | boolean | null | undefined = option.value;
  // eslint-disable-next-line default-case
  switch (option.type) {
    case ApplicationCommandOptionType.Channel:
      if (option.channel) optionValue = `${option.channel.type === ChannelType.GuildText ? '#' : ''}${option.channel.name}`;
      break;
    case ApplicationCommandOptionType.User:
      if (option.user) optionValue = getUserIdentifier(option.user);
      break;
    case ApplicationCommandOptionType.Role:
      if (option.role) optionValue = `@${option.role.name}`;
      break;
    case ApplicationCommandOptionType.Subcommand:
      optionValue = option.options ? stringifyOptionsData(option.options) : null;
      break;
  }
  return `(${optionName}${optionValue !== null ? `:${optionValue}` : ''})`;
}).join(' ');

export const isEphemeralResponse = (interaction: ChatInputCommandInteraction): boolean => interaction.options.getBoolean(GlobalCommandOptionName.EPHEMERAL) ?? false;


type BareNumberFormatter = Pick<Intl.NumberFormat, 'format'>;
const numberFormatterCache: Partial<Record<string, BareNumberFormatter>> = {};
export const getBareNumberFormatter = (interaction: Pick<CommandInteraction, 'locale'>) => {
  let numberFormatter: BareNumberFormatter | undefined = numberFormatterCache[interaction.locale];
  if (!numberFormatter) {
    numberFormatter = { format: (value: number): string => value.toString() };
    try {
      numberFormatter = new Intl.NumberFormat(interaction.locale);
    } catch (e) {
      console.error(`Failed to create number formatter with locale ${interaction.locale}`);
      console.error(e);
    }
    numberFormatterCache[interaction.locale] = numberFormatter;
  }
  return numberFormatter;
};
