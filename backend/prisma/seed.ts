import { PrismaClient, ProjectPriority, ProjectStatus, Role, TimeOffType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo1234';

const SKILLS: { name: string; category: string }[] = [
  { name: 'Java', category: 'Language' },
  { name: 'Python', category: 'Language' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'React', category: 'Frontend' },
  { name: 'Angular', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'AWS', category: 'Cloud' },
  { name: 'Azure', category: 'Cloud' },
  { name: 'GCP', category: 'Cloud' },
  { name: 'DevOps', category: 'Operations' },
  { name: 'Kubernetes', category: 'Operations' },
  { name: 'Docker', category: 'Operations' },
  { name: 'Architecture', category: 'Architecture' },
  { name: 'Security', category: 'Security' },
  { name: 'AI', category: 'Data' },
  { name: 'Data Engineering', category: 'Data' },
  { name: 'SQL', category: 'Data' },
  { name: 'Project Management', category: 'Delivery' },
  { name: 'Scrum', category: 'Delivery' },
  { name: 'UX Design', category: 'Design' },
];

const TEAMS = [
  { name: 'Platform Engineering', department: 'Engineering' },
  { name: 'Product Engineering', department: 'Engineering' },
  { name: 'Data & Analytics', department: 'Data' },
  { name: 'Cloud Infrastructure', department: 'Operations' },
  { name: 'Quality Assurance', department: 'Engineering' },
  { name: 'Security', department: 'Security' },
  { name: 'Design', department: 'Product' },
  { name: 'Customer Solutions', department: 'Delivery' },
];

const LOCATIONS = [
  'New York, US',
  'London, UK',
  'Berlin, DE',
  'Bangalore, IN',
  'Warsaw, PL',
  'Toronto, CA',
  'Singapore, SG',
  'Sydney, AU',
];

const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'QA Engineer',
  'DevOps Engineer',
  'Cloud Architect',
  'Data Engineer',
  'Data Scientist',
  'UX Designer',
  'Product Manager',
  'Security Engineer',
  'Solutions Architect',
  'Scrum Master',
];

const PROJECT_NAMES = [
  'Project Alpha',
  'Project Phoenix',
  'Project Falcon',
  'Project Horizon',
  'Project Atlas',
  'Project Nova',
  'Project Zenith',
  'Project Odyssey',
  'Project Pioneer',
  'Project Quantum',
  'Project Catalyst',
  'Project Meridian',
  'Project Summit',
  'Project Vertex',
  'Project Genesis',
  'Project Apex',
  'Project Nexus',
  'Project Titan',
  'Project Orbit',
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function clearData() {
  await prisma.notification.deleteMany();
  await prisma.timeOff.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.resourceSkill.deleteMany();
  await prisma.project.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.team.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();
}

async function seedSkills() {
  const skills: any[] = [];
  for (const s of SKILLS) {
    skills.push(await prisma.skill.create({ data: s }));
  }
  return skills;
}

async function seedTeams() {
  const teams: any[] = [];
  for (const t of TEAMS) {
    teams.push(await prisma.team.create({ data: t }));
  }
  return teams;
}

async function seedUsers(teams: Awaited<ReturnType<typeof seedTeams>>) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: { name: 'Alex Admin', email: 'admin@demo.io', role: Role.ADMIN, passwordHash },
  });

  const resourceManagers: any[] = [];
  for (const name of ['Rita Resource', 'Ravi Kumar']) {
    resourceManagers.push(
      await prisma.user.create({
        data: {
          name,
          email: `${name.split(' ')[0].toLowerCase()}@demo.io`,
          role: Role.RESOURCE_MANAGER,
          passwordHash,
        },
      }),
    );
  }

  const teamManagers: any[] = [];
  for (const team of teams) {
    const name = faker.person.fullName();
    const user = await prisma.user.create({
      data: {
        name,
        email: `${faker.internet.username({ firstName: name.split(' ')[0] }).toLowerCase()}@demo.io`,
        role: Role.TEAM_MANAGER,
        passwordHash,
      },
    });
    await prisma.team.update({ where: { id: team.id }, data: { managerId: user.id } });
    teamManagers.push({ user, team });
  }

  const viewer = await prisma.user.create({
    data: { name: 'Vera Viewer', email: 'viewer@demo.io', role: Role.VIEWER, passwordHash },
  });

  return { admin, resourceManagers, teamManagers, viewer };
}

async function seedResources(
  teams: Awaited<ReturnType<typeof seedTeams>>,
  skills: Awaited<ReturnType<typeof seedSkills>>,
  teamManagers: { user: any; team: any }[],
) {
  const resources: any[] = [];
  const totalResources = 50;
  const managerLinkByTeamId = new Map(teamManagers.map((tm) => [tm.team.id, tm.user.id]));

  for (let i = 0; i < totalResources; i++) {
    const team = teams[i % teams.length];
    const isFirstOfTeam = i < teams.length;
    const employmentPct = Math.random() < 0.85 ? 100 : pick([50, 60, 80]);
    const name = faker.person.fullName();

    const resource = await prisma.resource.create({
      data: {
        name,
        photoUrl: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
        jobTitle: isFirstOfTeam ? 'Engineering Manager' : pick(JOB_TITLES),
        teamId: team.id,
        department: team.department,
        location: pick(LOCATIONS),
        employmentPct,
        weeklyCapacityHours: 40,
        userId: isFirstOfTeam ? managerLinkByTeamId.get(team.id) : undefined,
      },
    });
    resources.push(resource);

    const skillCount = randomInt(2, 5);
    const chosenSkills = faker.helpers.arrayElements(skills, skillCount);
    for (const skill of chosenSkills) {
      await prisma.resourceSkill.create({
        data: { resourceId: resource.id, skillId: skill.id, level: randomInt(1, 5) },
      });
    }
  }

  return resources;
}

async function seedProjects(resources: Awaited<ReturnType<typeof seedResources>>) {
  const projects: any[] = [];
  const statusWeights: [ProjectStatus, number][] = [
    [ProjectStatus.PLANNING, 0.2],
    [ProjectStatus.RUNNING, 0.55],
    [ProjectStatus.COMPLETED, 0.2],
    [ProjectStatus.CANCELLED, 0.05],
  ];

  function pickStatus(): ProjectStatus {
    const r = Math.random();
    let acc = 0;
    for (const [status, weight] of statusWeights) {
      acc += weight;
      if (r <= acc) return status;
    }
    return ProjectStatus.RUNNING;
  }

  for (const name of PROJECT_NAMES) {
    const status = pickStatus();
    let startDate: Date;
    let endDate: Date | null;

    if (status === ProjectStatus.PLANNING) {
      startDate = daysFromNow(randomInt(10, 90));
      endDate = daysFromNow(randomInt(120, 300));
    } else if (status === ProjectStatus.COMPLETED) {
      startDate = daysFromNow(randomInt(-365, -180));
      endDate = daysFromNow(randomInt(-90, -5));
    } else if (status === ProjectStatus.CANCELLED) {
      startDate = daysFromNow(randomInt(-200, -60));
      endDate = daysFromNow(randomInt(-40, -1));
    } else {
      startDate = daysFromNow(randomInt(-180, -5));
      endDate = Math.random() < 0.7 ? daysFromNow(randomInt(15, 200)) : null;
    }

    const project = await prisma.project.create({
      data: {
        name,
        customer: faker.company.name(),
        priority: pick([
          ProjectPriority.LOW,
          ProjectPriority.MEDIUM,
          ProjectPriority.MEDIUM,
          ProjectPriority.HIGH,
          ProjectPriority.HIGH,
          ProjectPriority.CRITICAL,
        ]),
        startDate,
        endDate: endDate ?? undefined,
        status,
        budget: randomInt(50, 2000) * 1000,
        requiredCapacity: randomInt(20, 300),
        projectManagerId: pick(resources).id,
        isInternal: false,
      },
    });
    projects.push(project);
  }

  for (const name of ['Internal - Bench', 'Internal - Training & Enablement']) {
    const project = await prisma.project.create({
      data: {
        name,
        customer: null,
        priority: ProjectPriority.LOW,
        startDate: daysFromNow(-365),
        endDate: undefined,
        status: ProjectStatus.RUNNING,
        budget: undefined,
        requiredCapacity: undefined,
        projectManagerId: pick(resources).id,
        isInternal: true,
      },
    });
    projects.push(project);
  }

  return projects;
}

const HOURS_CHOICES = [5, 10, 10, 15, 15, 20, 20, 25, 30, 35];

async function seedAllocations(
  resources: Awaited<ReturnType<typeof seedResources>>,
  projects: Awaited<ReturnType<typeof seedProjects>>,
) {
  const activeProjects = projects.filter((p) => p.status !== ProjectStatus.CANCELLED);
  let created = 0;
  const targetRandom = 490;

  for (let i = 0; i < targetRandom; i++) {
    const resource = pick(resources);
    const project = pick(activeProjects);
    const startDate = daysFromNow(randomInt(-270, 180));
    const durationWeeks = randomInt(4, 16);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationWeeks * 7);

    await prisma.allocation.create({
      data: {
        resourceId: resource.id,
        projectId: project.id,
        hoursPerWeek: pick(HOURS_CHOICES),
        startDate,
        endDate,
      },
    });
    created++;
  }

  // Force a handful of resources to be clearly overallocated right now, for demo punch.
  const overallocatedPool = faker.helpers.arrayElements(resources, 5);
  for (const resource of overallocatedPool) {
    for (let j = 0; j < 2; j++) {
      await prisma.allocation.create({
        data: {
          resourceId: resource.id,
          projectId: pick(activeProjects).id,
          hoursPerWeek: pick([25, 30, 35]),
          startDate: daysFromNow(-14),
          endDate: daysFromNow(60),
        },
      });
      created++;
    }
  }

  // Force a handful of resources to be clearly available right now (no current allocation).
  const overallocatedIds = new Set(overallocatedPool.map((r) => r.id));
  const availablePool = faker.helpers
    .arrayElements(
      resources.filter((r) => !overallocatedIds.has(r.id)),
      5,
    )
    .map((r) => r.id);
  const now = new Date();
  await prisma.allocation.updateMany({
    where: { resourceId: { in: availablePool }, startDate: { lte: now }, OR: [{ endDate: null }, { endDate: { gte: now } }] },
    data: { endDate: daysFromNow(-1) },
  });

  return { created, overallocatedPool, availablePool };
}

async function seedTimeOffs(resources: Awaited<ReturnType<typeof seedResources>>) {
  const currentYear = new Date().getFullYear();
  const holidays = [
    { label: "New Year's Day", date: new Date(currentYear, 0, 1) },
    { label: 'Christmas Day', date: new Date(currentYear, 11, 25) },
  ];

  for (const resource of resources) {
    for (const holiday of holidays) {
      await prisma.timeOff.create({
        data: {
          resourceId: resource.id,
          type: TimeOffType.PUBLIC_HOLIDAY,
          startDate: holiday.date,
          endDate: holiday.date,
          label: holiday.label,
        },
      });
    }

    const vacationCount = randomInt(1, 2);
    for (let i = 0; i < vacationCount; i++) {
      const start = daysFromNow(randomInt(-180, 180));
      const duration = randomInt(3, 10);
      const end = new Date(start);
      end.setDate(end.getDate() + duration);
      await prisma.timeOff.create({
        data: { resourceId: resource.id, type: TimeOffType.VACATION, startDate: start, endDate: end, label: 'Vacation' },
      });
    }
  }

  // Force 3 resources onto leave right now.
  const onLeaveNow = faker.helpers.arrayElements(resources, 3);
  for (const resource of onLeaveNow) {
    await prisma.timeOff.create({
      data: {
        resourceId: resource.id,
        type: TimeOffType.VACATION,
        startDate: daysFromNow(-2),
        endDate: daysFromNow(5),
        label: 'Vacation',
      },
    });
  }

  return { onLeaveNow };
}

async function seedNotifications(
  overallocatedPool: { id: string; name: string }[],
  availablePool: string[],
  resources: { id: string; name: string }[],
  projects: { id: string; name: string; status: ProjectStatus; endDate: Date | null }[],
) {
  const endingSoon = projects.find(
    (p) => p.status === ProjectStatus.RUNNING && p.endDate && p.endDate > new Date() && p.endDate < daysFromNow(30),
  );
  const availableResource = resources.find((r) => availablePool.includes(r.id));

  const notifications: any[] = [];
  for (const r of overallocatedPool.slice(0, 3)) {
    notifications.push({
      type: 'OVER_ALLOCATION' as const,
      message: `${r.name} is overallocated this week — review their assignments.`,
      resourceId: r.id,
    });
  }
  if (endingSoon) {
    notifications.push({
      type: 'PROJECT_ENDING' as const,
      message: `${endingSoon.name} is ending soon — plan resource reallocation.`,
      projectId: endingSoon.id,
    });
  }
  if (availableResource) {
    notifications.push({
      type: 'RESOURCE_AVAILABLE' as const,
      message: `${availableResource.name} has no active allocations and is available now.`,
      resourceId: availableResource.id,
    });
  }
  notifications.push({
    type: 'VACATION_CONFLICT' as const,
    message: 'A planned vacation overlaps with an active allocation — check the calendar for conflicts.',
  });

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }
}

async function main() {
  console.log('Clearing existing data...');
  await clearData();

  console.log('Seeding skills...');
  const skills = await seedSkills();

  console.log('Seeding teams...');
  const teams = await seedTeams();

  console.log('Seeding users...');
  const { teamManagers } = await seedUsers(teams);

  console.log('Seeding resources (50 employees)...');
  const resources = await seedResources(teams, skills, teamManagers);

  console.log('Seeding projects (20)...');
  const projects = await seedProjects(resources);

  console.log('Seeding allocations (~500)...');
  const { created, overallocatedPool, availablePool } = await seedAllocations(resources, projects);
  console.log(`Created ${created} allocations.`);

  console.log('Seeding vacations & public holidays...');
  await seedTimeOffs(resources);

  console.log('Seeding demo notifications...');
  await seedNotifications(overallocatedPool, availablePool, resources, projects as any);

  console.log('\nSeed complete. Demo logins (password: "demo1234" for all):');
  console.log('  admin@demo.io        (Administrator)');
  console.log('  rita@demo.io         (Resource Manager)');
  console.log('  ravi@demo.io         (Resource Manager)');
  console.log('  viewer@demo.io       (Viewer / Executive)');
  console.log('  Team Manager accounts: see GET /auth/demo-users for the full roster.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
