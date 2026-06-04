export const TECHNOLOGIES = {
  言語: ["PHP", "Python", "Ruby", "Go", "Java", "TypeScript", "JavaScript", "Swift", "Kotlin"],
  フレームワーク: ["Laravel", "Rails", "Django", "FastAPI", "Spring", "Next.js", "React", "Vue.js", "NestJS"],
  DB: ["MySQL", "PostgreSQL", "MongoDB", "Redis", "DynamoDB"],
  インフラ: ["AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Nginx"],
  ツール: ["GitHub", "GitLab", "Slack", "Jira", "Figma", "SendGrid", "GraphQL"],
} as const;

// 自動補完候補（フラットなユニーク配列）
export const TECHNOLOGY_OPTIONS: string[] = Array.from(
  new Set(Object.values(TECHNOLOGIES).flat()),
);
