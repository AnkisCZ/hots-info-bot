import { HeroData } from "../hero-data";
import { Message, MessageEmbed } from "discord.js";
import { SkillFormatter } from "../skill-formatter";
import * as _ from "lodash";

export function outputHeroOverview(search: string, message: Message, useEmbeds: boolean) {
    const searchHero = HeroData.makeSearchableName(search);
  const hero = HeroData.heroes.find(h => h.nameLower == searchHero);
  const winRates = HeroData.winrates.find(h => HeroData.makeSearchableName(h.hero) == searchHero);
  if (useEmbeds) {
      const embed = new MessageEmbed().setColor(0x00AE86);
      embed.setTitle(`${hero.name} Skills Overview:`);
      embed.setDescription(`View popular builds at [HotsLogs.com](https://www.hotslogs.com/Sitewide/HeroDetails?Hero=${hero.name.replace(/\s/g, "%20")})`);
      if (winRates) {
          embed.addField("Performance", `*Win Rate*: ${winRates.winRate}%\t*Popularity*: #${winRates.popRank}\t*Ban Rank*: #${winRates.banRank}`);
      }
      hero.skills.forEach(skill => {
          SkillFormatter.embed(embed, skill, false);
      });

      return message.channel.send({ embed })
          .catch(console.error);
  } else {
      let textResponse = `**${hero.name} Skills Overview**:\n`;
      if (winRates) {
        textResponse += `*Win Rate*: ${winRates.winRate}%\t*Popularity*: #${winRates.popRank}\t*Ban Rank*: #${winRates.banRank}\n`;
    }
      hero.skills.forEach(skill => {
          textResponse += SkillFormatter.longText(skill, false);
          if (textResponse.length > 1500) {
              message.channel.send(textResponse);
              textResponse = "";
          }
      });

      return message.channel.send(textResponse)
          .catch(console.error);
  }
}