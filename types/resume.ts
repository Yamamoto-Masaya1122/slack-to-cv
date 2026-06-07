// Step1（初期設定）フォーム値
export type InitialSettingValues = {
  dateFrom: string;
  dateTo: string;
  channelId: string;
};

// Step2（職務経歴書作成）フォーム値
export type ChannelFormValues = {
  periodFrom: { year: string; month: string };
  periodTo: { year: string; month: string };
  jobTitle: string;
  role: string;
  teamSize: string;
  jobDescription: string;
  technologies: string[];
};
