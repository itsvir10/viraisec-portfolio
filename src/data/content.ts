// All the text on the site lives here. Edit this file to change content.
// Articles are separate: they are Markdown files in src/articles/.

export type Field = 'security' | 'ai';

export const profile = {
  name: 'Virdhawal Jadhav',
  short: 'Vir',
  taglineLines: ['Break it. Defend it.', 'Teach it to think.'],
  sub: 'Cyber Security & AI | Curtin University',
  location: 'Perth, Australia',
  email: 'vir.professional@tuta.com',
  linkedin: 'https://linkedin.com/in/vir-jdv',
  linkedinLabel: 'linkedin.com/in/vir-jdv',
  github: 'https://github.com/itsvir10',
  githubLabel: 'github.com/itsvir10',
};

// Typed out when the site first opens.
export const boot = ['> initialising vir.sys...', '> loading modules: security, ai, linux', '> ready'];

// Flashes past after choosing the graphical site. Half security, half AI.
export const burst: { field: Field; text: string }[] = [
  { field: 'security', text: 'nmap -sV 10.0.0.0/24' },
  { field: 'ai', text: 'epoch 12/50 loss=0.0342' },
  { field: 'security', text: '[wazuh] rule 550: integrity checksum changed' },
  { field: 'ai', text: 'agent.plan(): 4 tool calls queued' },
  { field: 'security', text: 'tail -f /var/log/auth.log' },
  { field: 'ai', text: 'embedding 1,024 chunks...' },
  { field: 'security', text: 'ufw deny 23/tcp' },
  { field: 'ai', text: 'model.eval() accuracy=0.94' },
  { field: 'security', text: 'ossec-agent: connected to manager 10.0.2.15' },
  { field: 'ai', text: 'tokenizer: 48,211 tokens in context' },
  { field: 'security', text: 'iptables -A INPUT -p tcp --dport 22 -j ACCEPT' },
  { field: 'ai', text: 'tool_call: search(query="internship perth")' },
  { field: 'security', text: 'sha256sum -c baseline.db ... OK' },
  { field: 'ai', text: 'gradient step 3,400 lr=3e-4' },
  { field: 'security', text: 'tcpdump -i eth0 port 443 -c 200' },
  { field: 'ai', text: 'agent.reflect(): plan revised, 2 steps left' },
];

export const about = {
  heading: 'Two fields, one obsession.',
  paragraphs: [
    {
      field: 'security' as Field,
      text: "I got into security because people trust systems way too casually, and most of those systems don't deserve it.",
    },
    {
      field: 'ai' as Field,
      text: "AI pulls me just as hard. Right now I'm building agent workflows that do real work, and ML is next.",
    },
  ],
  chips: ['CompTIA Security+', 'AWS Cloud Foundations', 'AI agent builder'],
  facts: [
    { label: 'Degree', value: 'Bachelor of Computing (Cyber Security)' },
    { label: 'University', value: 'Curtin University, Perth' },
    { label: 'Timeline', value: 'Feb 2025 to Nov 2027 (expected)' },
    { label: 'Interested in', value: 'Security engineering and AI' },
  ],
};

// The two headline skill blocks, shown side by side at equal size.
export const skillsCore: { field: Field; title: string; note: string; items: string[] }[] = [
  {
    field: 'security',
    title: 'Security',
    note: 'Watching, detecting, locking down',
    items: ['SIEM (Wazuh)', 'IDS', 'Log Analysis', 'Network Security', 'ACLs', 'VPN', 'Data Security'],
  },
  {
    field: 'ai',
    title: 'AI',
    note: 'Agents that do real work',
    items: ['AI Agents', 'Workflow Automation', 'Prompt Engineering', 'Claude / Claude Code', 'Machine Learning: learning now'],
  },
];

// Shared foundations under both.
export const skillsFoundations: { title: string; items: string[] }[] = [
  { title: 'Systems', items: ['Linux', 'Bash', 'Shell Scripting', 'Sysadmin'] },
  { title: 'Code', items: ['Python', 'C', 'Data Structures'] },
  { title: 'Cloud and networking', items: ['AWS', 'Computer Networking'] },
];

// Oldest first, so the timeline reads left to right in the order they were earned.
// Each one opens a pop-up with a short summary and what it covers.
export type Cert = {
  title: string;
  issuer: string;
  detail: string;
  field: Field | 'both';
  about: string;
  outcomes: string[];
};

export const certs: Cert[] = [
  {
    title: 'CS50',
    issuer: 'Harvard University',
    detail: 'Introduction to Computer Science',
    field: 'both',
    about: "Harvard's introduction to computer science: programming from the ground up, starting in C and moving to Python, SQL and the web.",
    outcomes: [
      'Programming in C, including memory, pointers and how programs run underneath',
      'Algorithms and data structures: searching, sorting, linked lists, hash tables',
      'Python and SQL for scripting and working with data',
      'Building web apps with HTML, CSS, JavaScript and Flask',
    ],
  },
  {
    title: 'AWS Academy Cloud Foundations',
    issuer: 'AWS Academy (Amazon Web Services)',
    detail: 'Graduate, May 2026',
    field: 'both',
    about: 'An introduction to cloud computing on AWS: what the cloud is, the core services, and how they are secured and paid for.',
    outcomes: [
      'Core services: compute (EC2), storage (S3), networking (VPC) and databases',
      'Identity and access management, and the shared responsibility model',
      'Designing for reliability with load balancing and auto scaling',
      'How cloud pricing and billing work',
    ],
  },
  {
    title: 'CompTIA Security+',
    issuer: 'CompTIA',
    detail: 'SY0-701',
    field: 'security',
    about: 'An industry-recognised certification covering the core knowledge for an entry-level security role.',
    outcomes: [
      'Core security concepts, including cryptography and identity and access management',
      'Threats, vulnerabilities and how to mitigate them',
      'Secure architecture for networks, systems and the cloud',
      'Security operations: monitoring, incident response and forensics',
      'Governance, risk management and compliance',
    ],
  },
];

export const sections = [
  { id: 'hero', label: 'Top' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'articles', label: 'Articles' },
  { id: 'certs', label: 'Certs' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof sections)[number]['id'];
