import { NavigatorScreenParams } from '@react-navigation/native';
import { DocumentRecord, Task } from './index';

export type MainTabParamList = {
  Dashboard: undefined;
  ProjectProgress: { projectId?: string; initialTrade?: string };
  RecordAction: undefined; // Elevated (+) button
  ExpenseEntry: { projectId?: string };
  Documents: { projectId?: string; category?: string };
};

export type RootStackParamList = {
  Login: undefined;
  PendingApproval: { email?: string; name?: string };
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Settings: undefined;
};

