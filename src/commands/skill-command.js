const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const { getSkillData } = require('../load-data');

const _ = require('lodash');

class SkillCommand extends Command {    
    

    constructor() {        
        super('skill', {
            trigger: /\[\[[^\]]+?\]\]/ig            
        });        

        this.skills = [];
        this.talents = [];
        this.heroes = [];
        this.heroNames = [];

        getSkillData(hero => {
            let heroSummary = {
                name: hero.name,
                nameLower: hero.name.toLowerCase(),
                role: hero.role,
                type: hero.type,
                talents: {},
                skills: []
            }

            this.heroNames.push(heroSummary.nameLower);

            hero.skills.forEach(skillSet => {
                skillSet.forEach(skill => {    
                    let hotkey = skill.hotkey;
                    if (!hotkey || hotkey == null || hotkey == undefined) {
                        hotkey = skill.trait ? 'Trait' : 'Passive';
                    }
                    let skillSummary = {
                        nameLower: skill.name.toLowerCase(),
                        name: skill.name,
                        hero: hero.name,
                        hotkey: hotkey,
                        cooldown: skill.cooldown || 'None',
                        manaCost: skill.manaCost || 'None',
                        description: skill.description
                    }
                    heroSummary.skills.push(skillSummary);
                    this.skills.push(skillSummary);                             
                });
            });

            for(let tiernum in hero.talents) {                
                let tier = hero.talents[tiernum];
                heroSummary.talents[tiernum] = []
                let tierSummary = [];
                tier.forEach(talent => {
                    
                    let talentSummary = {
                        nameLower: talent.name.toLowerCase(),
                        name: talent.name,
                        hero: hero.name,                        
                        tier: tiernum,
                        description: talent.description
                    }
                    this.talents.push(talentSummary);
                    heroSummary.talents[tiernum].push(talentSummary);
                });
            }

            this.heroes.push(heroSummary);
            this.heroes.sort((a, b) => {
                if (a.nameLower < b.nameLower) return -1;
                if (a.nameLower > b.nameLower) return 1;
                return 0;
            });
        });
    }
   
    findSkillOrTalent(name) {
        let matches = { skills: [], talents: [] };
        let nameLower = name.trim().toLowerCase();        

        this.skills.forEach(skill => {
            if (skill.nameLower.includes(nameLower)) {
                matches.skills.push(skill);
            }
        });

        this.talents.forEach(talent => {
            if (talent.nameLower.includes(nameLower)){
                matches.talents.push(talent)
            }
        });

        return matches;
    }

    findHeroTalentTier(heroName, tier) {
        let heroNameLower = heroName.toLowerCase();
        let matchingHero = this.heroes.find(h => 
            {
                let isExactMatch = h.nameLower == heroNameLower;                

                let isWordMatch = h.nameLower
                    .split(' ')
                    .some(word => word.startsWith(heroNameLower));

                let isStartsWithMatch = h.nameLower.startsWith(heroNameLower);

                return (isExactMatch || isWordMatch || isStartsWithMatch);
            }
        );
        if (!matchingHero) return [];
        return matchingHero.talents[tier] || [];
    }

    isHeroTalentTierSearch(searchText) {
        const pattern = /[\D]+\/[\d]{1,2}/i;
        return pattern.test(searchText);
    }

    isSkillOrTalentSearch(searchText) {
        const pattern = /[\D]+/i;
        return pattern.test(searchText);
    }

    isJimmy(searchText){
        const pattern = /^jimmy$/i;
        return pattern.test(searchText);
    }    

    isHeroSearch(searchText) {
        return this.heroNames.some(hn => hn == searchText.toLowerCase());
    }

    outputHeroSkills(search, message, useEmbeds) {
        let hero = this.heroes.find(h => h.nameLower == search.toLowerCase());
        if (useEmbeds) {
            let embed = new RichEmbed().setColor(0x00AE86);   
            embed.setTitle(`${hero.name} Skills Overview:`);
            embed.setDescription(`View popular builds at [HotsLogs.com](https://www.hotslogs.com/Sitewide/HeroDetails?Hero=${hero.name.replace(/\s/g, '%20')})`);
            hero.skills.forEach(skill => {
                let skillDescription = `**Hotkey**: ${skill.hotkey}\t\t**Cooldown**: ${skill.cooldown}\t\t**Cost**: ${skill.manaCost}\n\n_${skill.description}_\n\n`
                embed.addField(`${skill.name}`, skillDescription);
            });        
    
            return message.channel.send({embed})
                .catch(console.error);
        } else {
            let textResponse = `**${hero.name} Skills Overview**:`
            hero.skills.forEach(skill => {
                textResponse = textResponse + `**${skill.name}**`;
                textResponse = textResponse + `**Hotkey**: ${skill.hotkey}\t\t**Cooldown**: ${skill.cooldown}\t\t**Cost**: ${skill.manaCost}\n\n_${skill.description}_\n\n`                
            });
        }        
    }

    outputHeroTalentTier(search, message, useEmbeds) {
        const heroPattern = /[^\d\/]+/i;
        const tierPattern = /[\d]{1,2}/i;

        let heroSearch = search.match(heroPattern)[0].trim();
        let tierSearch = search.match(tierPattern)[0];

        if (heroSearch == '') {
            return message.reply(`Please provide a hero name to search for talents by tier.`);
        }

        let tier = this.findHeroTalentTier(heroSearch, tierSearch);
        if (tier.length === 0) {
            return message.reply(`Couldn't find a hero talent tier for '${search}'`);
        }
        if (useEmbeds) {
            let embed = new RichEmbed() 
            .setColor(0x00AE86)
            .setTitle(`${tier[0].hero} Level ${tier[0].tier} Talents:`);
        
            tier.forEach(talent => {
                let talentDescription = `\n_${talent.description}_\n\n`
                embed.addField(`${talent.name}`, talentDescription);
            });

            return message.channel.send({embed})
                    .catch(console.error);
        } else {
            let textResponse = `${tier[0].hero} Level ${tier[0].tier} Talents:`;
            tier.forEach(talent => {
                textResponse = textResponse + `**${talent.name}**\n`;
                textResponse = textResponse + `_${talent.description}_\n\n`                
            });

            return message.channel.send(textResponse);
        }
        
    }

    outputSkillsOrTalents(search, message, useEmbeds) {
        if (search.trim() == '') {
            return message.reply(`You're going to have to give me _something_ to look for.`);
        }

        let talentsAndSkills = this.findSkillOrTalent(search);
        let totalCount = (talentsAndSkills.skills.length + talentsAndSkills.talents.length);
        if (totalCount == 0) {                
            return message.reply(`Didn't find any skills or talents matching '${search}', sorry.`);                
        } 
        
        if (totalCount > 10) {                 
            return message.reply(`You're going to have to be way more specific, there are ${totalCount} matches for '${search}'.`);
        }
        
        if (totalCount > 4 && totalCount <= 10) {                
            let shortVersions = [];                
            talentsAndSkills.skills.forEach(skill => {
                shortVersions.push(`**${skill.name}** _${skill.hero} (${skill.hotkey})_`);                    
            });

            talentsAndSkills.talents.forEach(talent => {
                shortVersions.push(`**${talent.name}** _${talent.hero} (Level ${talent.tier})_`);                    
            });
            return message.channel.send(`There are ${totalCount} matches for '${search}':\n${shortVersions.join('\n')}\nBe more specific for more detail.`);
        } 

        let mentionedSkills = [];
        
        if (useEmbeds) {
            let embed = new RichEmbed().setColor(0x00AE86);                            
    
            talentsAndSkills.skills.forEach(skill => {
                mentionedSkills.push(skill.name);
                let skillDescription = `**Hotkey**: ${skill.hotkey}\t\t**Cooldown**: ${skill.cooldown}\t\t**Cost**: ${skill.manaCost}\n\n_${skill.description}_\n\n`
                embed.addField(`${skill.name} (${skill.hero})`, skillDescription);
            });
    
            talentsAndSkills.talents.forEach(talent => {
                if (!mentionedSkills.includes(talent.name)) {
                    let talentDescription = `\n_${talent.description}_\n\n`
                    embed.addField(`${talent.name} (${talent.hero} level ${talent.tier})`, talentDescription);
                    mentionedSkills.push(talent.name);
                }            
            });
                    
            return message.channel.send({embed})
                   .catch(console.error);     
        } else {
            let textResponse = '';
            talentsAndSkills.skills.forEach(skill => {
                mentionedSkills.push(skill.name);
                textResponse = textResponse + `**${skill.name}** (${skill.hero})\n`;
                textResponse = textResponse + `**Hotkey**: ${skill.hotkey}\t\t**Cooldown**: ${skill.cooldown}\t\t**Cost**: ${skill.manaCost}\n\n_${skill.description}_\n\n`                
            });
    
            talentsAndSkills.talents.forEach(talent => {
                if (!mentionedSkills.includes(talent.name)) {
                    textResponse = textResponse + `${talent.name} (${talent.hero} level ${talent.tier})\n`
                    textResponse = textResponse + `_${talent.description}_\n\n`                    
                    mentionedSkills.push(talent.name);
                }            
            });

            return message.channel.send(textResponse);
        }
           
    }

    exec(message, match, groups) {
        let skillMatches = message.cleanContent.match(/\[\[[^\]]+?\]\]/ig)
        skillMatches = _.chain(skillMatches)
                        .map(m => m.replace(/(\[|\])/ig,'').replace(/\s/ig, ' ').trim())
                        .uniqBy(m => m)
                        .value();
        if (skillMatches.length > 4) {
            message.reply(`I can only search for up to 4 things at once, don't be cheeky.`);
            skillMatches = skillMatches.slice(0, 4);
        }
        
        let me = message.client.user;        
        let myPermissions = message.channel.permissionsFor(me);
        let useEmbeds = myPermissions.has("EMBED_LINKS");

        skillMatches.forEach(search => {                        
            if (this.isJimmy(search)) {
                return message.reply("This is Jimmy, now shut up.");
            }

            if (this.isHeroSearch(search)) {
                return this.outputHeroSkills(search, message, useEmbeds);
            }

            if (this.isHeroTalentTierSearch(search)){
                return this.outputHeroTalentTier(search, message, useEmbeds);
            }

            if (this.isSkillOrTalentSearch(search)){
                return this.outputSkillsOrTalents(search, message, useEmbeds);
            }

            return message.reply(`I have no idea what to do with '${search}', are you sure you know how to use me?`);
        });
    }
}

module.exports = SkillCommand;