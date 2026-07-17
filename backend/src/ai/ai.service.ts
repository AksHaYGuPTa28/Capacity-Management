import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { currentAllocations } from '../common/utils/allocation.util';

export interface ResourceLoad {
  id: string;
  name: string;
  jobTitle: string;
  team: string | null;
  effectiveCapacity: number;
  allocatedHours: number;
  remainingCapacity: number;
  utilization: number;
  status: string;
  skills: { name: string; level: number }[];
}

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  /**
   * Rule-based question answering over the seeded demo data. Deterministic and offline by
   * design (no external LLM call), so the demo works without an API key.
   */
  async ask(question: string) {
    const q = question.toLowerCase();
    const loads = await this.resourceLoads();
    const skills = await this.prisma.skill.findMany();

    const mentionedSkill = skills.find((s) => q.includes(s.name.toLowerCase()));

    if (/deliver|can we (do|complete|finish)/.test(q)) {
      return this.canDeliver(q);
    }
    if (/suggest|recommend|best (candidate|people|person)/.test(q)) {
      return this.suggestCandidates(q, loads, mentionedSkill?.name);
    }
    if (/overallocat|over.allocated|too busy/.test(q)) {
      const candidates = loads.filter((r) => r.status === 'OVER_ALLOCATED');
      return this.respond(
        `${candidates.length} people are currently overallocated.`,
        candidates,
      );
    }
    if (/underallocat|under.allocated|free capacity|spare capacity/.test(q)) {
      const candidates = loads.filter((r) => r.utilization < 50 && r.status !== 'LEAVE');
      return this.respond(`${candidates.length} people have significant free capacity (under 50% utilized).`, candidates);
    }
    if (mentionedSkill) {
      const candidates = loads.filter((r) => r.skills.some((s) => s.name === mentionedSkill.name));
      return this.respond(
        `${candidates.length} people have ${mentionedSkill.name} skills.`,
        candidates.sort((a, b) => b.remainingCapacity - a.remainingCapacity),
      );
    }
    if (/available|free/.test(q)) {
      const candidates = loads.filter((r) => r.status === 'AVAILABLE' || r.status === 'PARTIAL');
      return this.respond(`${candidates.length} people are available or have spare capacity.`, candidates);
    }

    return this.respond(
      "I can answer questions like: 'Who is available next month?', 'Who has AWS skills?', 'Who is overallocated?', 'Can we deliver Project Alpha?', or 'Suggest people for this project'.",
      [],
    );
  }

  private async canDeliver(q: string) {
    const projects = await this.prisma.project.findMany({ include: { allocations: true } });
    const match = projects.find((p) => q.includes(p.name.toLowerCase()));
    if (!match) {
      return this.respond(
        `I couldn't find a project matching that name. Try one of: ${projects.slice(0, 5).map((p) => p.name).join(', ')}.`,
        [],
      );
    }
    const allocatedHours = currentAllocations(match.allocations).reduce((s, a) => s + a.hoursPerWeek, 0);
    const required = match.requiredCapacity ?? 0;
    const staffingPct = required > 0 ? Math.round((allocatedHours / required) * 100) : null;
    const verdict =
      staffingPct === null
        ? 'no required-capacity target is set, so staffing coverage cannot be judged.'
        : staffingPct >= 95
          ? 'yes, the project is fully staffed against its required capacity.'
          : staffingPct >= 70
            ? 'likely, but the project is understaffed and at risk without more allocation.'
            : 'unlikely as staffed today: the project is significantly understaffed.';

    return this.respond(
      `${match.name}: ${allocatedHours}h/week allocated vs ${required}h/week required` +
        (staffingPct !== null ? ` (${staffingPct}% staffed).` : '.') +
        ` Delivery outlook: ${verdict}`,
      [],
      { project: match.name, status: match.status, allocatedHours, requiredCapacity: required, staffingPct },
    );
  }

  private suggestCandidates(q: string, loads: ResourceLoad[], skillName?: string) {
    let pool = loads.filter((r) => r.status !== 'LEAVE' && r.remainingCapacity > 0);
    if (skillName) {
      pool = pool.filter((r) => r.skills.some((s) => s.name === skillName));
    }
    const ranked = pool
      .sort((a, b) => {
        const skillScoreA = skillName ? (a.skills.find((s) => s.name === skillName)?.level ?? 0) : 0;
        const skillScoreB = skillName ? (b.skills.find((s) => s.name === skillName)?.level ?? 0) : 0;
        if (skillScoreB !== skillScoreA) return skillScoreB - skillScoreA;
        return b.remainingCapacity - a.remainingCapacity;
      })
      .slice(0, 8);

    return this.respond(
      skillName
        ? `Top candidates with ${skillName} skills, ranked by skill level and availability.`
        : 'Top candidates ranked by available capacity.',
      ranked,
    );
  }

  private async resourceLoads(): Promise<ResourceLoad[]> {
    const resources = await this.prisma.resource.findMany({
      include: { team: true, allocations: true, timeOffs: true, skills: { include: { skill: true } } },
    });
    const now = new Date();
    return resources.map((r) => {
      const effectiveCapacity = (r.weeklyCapacityHours * r.employmentPct) / 100;
      const allocatedHours = currentAllocations(r.allocations).reduce((s, a) => s + a.hoursPerWeek, 0);
      const utilization = effectiveCapacity > 0 ? (allocatedHours / effectiveCapacity) * 100 : 0;
      const onLeave = r.timeOffs.some((t) => t.startDate <= now && now <= t.endDate);
      let status: string;
      if (onLeave) status = 'LEAVE';
      else if (utilization > 100) status = 'OVER_ALLOCATED';
      else if (utilization >= 80) status = 'FULLY_ALLOCATED';
      else if (utilization > 0) status = 'PARTIAL';
      else status = 'AVAILABLE';
      return {
        id: r.id,
        name: r.name,
        jobTitle: r.jobTitle,
        team: r.team?.name ?? null,
        effectiveCapacity: round1(effectiveCapacity),
        allocatedHours: round1(allocatedHours),
        remainingCapacity: round1(effectiveCapacity - allocatedHours),
        utilization: round1(utilization),
        status,
        skills: r.skills.map((s) => ({ name: s.skill.name, level: s.level })),
      };
    });
  }

  private respond(answer: string, candidates: ResourceLoad[], extra: Record<string, unknown> = {}) {
    return { answer, candidates, ...extra };
  }
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
