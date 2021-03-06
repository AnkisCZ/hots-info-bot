import { ISkillData } from "./interfaces";
import { MessageEmbed } from "discord.js";

export class SkillFormatter {
    static shortText(skill: ISkillData, includeHero: boolean): string {
        if (includeHero) {
            return `**${skill.name}** _${skill.hero} (${skill.hotkey})_`;
        }

        return `**${skill.name}** _(${skill.hotkey})_`;
    }

    static longText(skill: ISkillData, includeHero: boolean): string {
        let output = `**${skill.name}**`;
        if (includeHero) {
            output += ` (${skill.hero}${ skill.state == "" ? "" : " " + skill.state})`;
        } else {
            if (skill.state !== "") output += ` (${skill.state})`;
        }
        output += `\n**Hotkey**: ${skill.hotkey}\t\t**Cooldown**: ${skill.cooldown || "None"}\t\t**Cost**: ${skill.manaCost || "None"}\n`;
        output += `_${skill.description}_\n\n`;

        return output;
    }

    static embed(embed: MessageEmbed, skill: ISkillData, includeHero: boolean): MessageEmbed {
        let skillDescription = `**Hotkey**: ${skill.hotkey}\t\t**Cooldown**: ${skill.cooldown || "None"}\t\t**Cost**: ${skill.manaCost || "None"}\n\n`;
        skillDescription += `_${skill.description}_\n\n`;

        let skillTitle = `${skill.name}`;
        if (includeHero) {
            if (skill.state == "")
                skillTitle += ` (${skill.hero})`;
            else
                skillTitle += ` (${skill.hero} ${skill.state})`;
        } else {
            if (skill.state !== "")
                skillTitle += ` (${skill.state})`;
        }
        embed.addField(skillTitle, skillDescription);

        return embed;
    }
}