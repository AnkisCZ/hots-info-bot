import * as fs from "fs";
import { exec, ChildProcess } from "child_process";
import {
  ISkillData,
  IHeroData,
  ITalentData,
  ISkillsAndTalentsResult,
  IWinRate
} from "./interfaces";
import {
  getWinRates
} from "./get-winrates";

import fetch from "node-fetch";
import {
  IPatchNotesHero
} from "./interfaces/IPatchNotesHero";

import got from "got";

export class HeroData {
  static skills: ISkillData[] = [];
  static talents: ITalentData[] = [];
  static heroes: IHeroData[] = [];
  static heroNames: string[] = [];
  static winrates: IWinRate[] = [];
  static totalGames: number = 0;

  static loadData(): void {
    this.getSkillData(this.processHero);
  }

  static refreshWinRate(): void {
    getWinRates(data => {
      this.winrates = data;
      if (data.length > 0) {
        const gamesPickedAndBanned = data[0].games + data[0].banCount;
        this.totalGames = gamesPickedAndBanned / (data[0].popRate / 100);
      }
      console.info("Win Rates updated");
    });
  }

  static findSkillOrTalent(name: string): ISkillsAndTalentsResult {
    const matches: ISkillsAndTalentsResult = {
      skills: [],
      talents: []
    };
    const nameLower = HeroData.makeSearchableName(name);

    this.skills.forEach(skill => {
      if (skill.nameLower.includes(nameLower)) {
        matches.skills.push(skill);
      }
    });

    this.talents.forEach(talent => {
      if (talent.nameLower.includes(nameLower)) {
        matches.talents.push(talent);
      }
    });

    return matches;
  }

  static getSkillByHotkey(hero: string, hotkey: string): ISkillsAndTalentsResult {
    const matches: ISkillsAndTalentsResult = {
      skills: [],
      talents: []
    };
    const heroNameLower = HeroData.makeSearchableName(hero);
    const matchingHero = this.heroes.find(h => {
      const isExactMatch = h.nameLower == heroNameLower;

      const isWordMatch = h.nameLower
        .split(" ")
        .some(word => word.startsWith(heroNameLower));

      const isStartsWithMatch = h.nameLower.startsWith(heroNameLower);

      return (isExactMatch || isWordMatch || isStartsWithMatch);
    });
    if (!matchingHero) return matches;
    matches.skills.push(... matchingHero.skills.filter(s => s.hotkey === hotkey.toUpperCase()));
    return matches;
  }

  static descriptionSearch(effect: string): ISkillsAndTalentsResult {
    const matches: ISkillsAndTalentsResult = {
      skills: [],
      talents: []
    };
    const pattern = new RegExp(effect, "ig");

    this.skills.forEach(skill => {
      if (pattern.test(skill.description)) {
        matches.skills.push(skill);
      }
    });

    this.talents.forEach(talent => {
      if (pattern.test(talent.description)) {
        matches.talents.push(talent);
      }
    });

    return matches;
  }

  static findHeroTalentTier(heroName: string, tier: string): ITalentData[] {
    const heroNameLower = HeroData.makeSearchableName(heroName);
    const matchingHero = this.heroes.find(h => {
      const isExactMatch = h.nameLower == heroNameLower;

      const isWordMatch = h.nameLower
        .split(" ")
        .some(word => word.startsWith(heroNameLower));

      const isStartsWithMatch = h.nameLower.startsWith(heroNameLower);

      return (isExactMatch || isWordMatch || isStartsWithMatch);
    });
    if (!matchingHero) return [];
    return matchingHero.talents.get(tier) || [];
  }

  private static getSkillData(onHero: (hd: string) => void) {
    const filePattern = /\/heroespatchnotes\/heroes-talents\/blob\/master\/hero\/(.+?\.json)/ig;

    got("https://github.com/heroespatchnotes/heroes-talents/tree/master/hero").then(response => {
      const matches = [...response.body.matchAll(filePattern)];
      console.log(`Got hero list, ${matches.length} heroes found`);
      matches.forEach(m => onHero(m[1]));
    });
  }

  static makeSearchableName(name: string): string {
    const badChars = /[^a-z0-9]/ig;
    return name.replace(badChars, "").toLowerCase();
  }

  private static processHero(apiHero: string) {
    const pattern: RegExp = /\.json/i;
    if (!pattern.test(apiHero)) return;

    const heroSummary: IHeroData = {
      name: "",
      nameLower: "",
      type: "",
      role: "",
      talents: new Map < string,
      ITalentData[] > (),
      skills: []
    };

    const heroTalentDataRepo = "https://github.com/heroespatchnotes/heroes-talents/raw/master/hero/";


    fetch(`${heroTalentDataRepo}${apiHero}`).then(response => {
      response.json().then((hero: IPatchNotesHero) => {
        heroSummary.name = hero.name;
        heroSummary.nameLower = HeroData.makeSearchableName(hero.name);
        if (!HeroData.heroNames.some(n => n == heroSummary.nameLower)) HeroData.heroNames.push(heroSummary.nameLower);
        heroSummary.role = hero.expandedRole;
        heroSummary.type = hero.type;

        for (const stance in hero.abilities) {
          hero.abilities[stance].forEach(skill => {
            const stateName = stance.replace(hero.name, "");
            let hotkey = skill.hotkey;
            if (!hotkey && skill.trait) hotkey = "Trait";

            const skillSummary: ISkillData = {
              nameLower: HeroData.makeSearchableName(skill.name),
              name: skill.name,
              hero: hero.name,
              hotkey: hotkey,
              cooldown: skill.cooldown,
              manaCost: +skill.manaCost,
              description: skill.description,
              state: stateName
            };
            heroSummary.skills.push(skillSummary);
            const existingSkillIndex = HeroData.skills.findIndex(s => s.name == skillSummary.name && s.hero == skillSummary.hero);
            if (existingSkillIndex >= 0) {
              HeroData.skills[existingSkillIndex] = skillSummary;
            } else {
              HeroData.skills.push(skillSummary);
            }
          });
        }

        for (const tier in hero.talents) {
          hero.talents[tier].forEach(talent => {
            const talentSummary: ITalentData = {
              nameLower: HeroData.makeSearchableName(talent.name),
              name: talent.name,
              hero: hero.name,
              tier: tier.toString(),
              description: talent.description
            };

            if (!heroSummary.talents.has(talentSummary.tier)) {
              heroSummary.talents.set(talentSummary.tier, [talentSummary]);
            } else {
              heroSummary.talents.get(talentSummary.tier).push(talentSummary);
            }

            const existingTalentIndex = HeroData.talents.findIndex(t => t.name == talentSummary.name && t.hero == talentSummary.hero);
            if (existingTalentIndex >= 0) {
              HeroData.talents[existingTalentIndex] = talentSummary;
            } else {
              HeroData.talents.push(talentSummary);
            }
          });

          const existingHeroIndex = HeroData.heroes.findIndex(h => h.name == heroSummary.name);
          if (existingHeroIndex >= 0) {
            HeroData.heroes[existingHeroIndex] = heroSummary;
          } else {
            HeroData.heroes.push(heroSummary);
            HeroData.heroes.sort((a, b) => {
              if (a.nameLower < b.nameLower) return -1;
              if (a.nameLower > b.nameLower) return 1;
              return 0;
            });
          }
        }
      });
    });
  }
}