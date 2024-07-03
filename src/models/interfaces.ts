import { ReactNode } from "react";
export interface AnalyticsTrackerProps {
  children: ReactNode;
  appName: string;
  appVersion: string;
  reportingEndpoint: string;
}
// export interface NetworkConnectionInfo {
//   rtt?: number;
//   type?: string;
//   saveData?: boolean;
//   downLink?: number;
//   effectiveType?: string;
//   isOnline: boolean;
// }
export interface EventDetails {
  data: string | null | undefined;
  event: string | null | undefined;
  element: string | null | undefined;
  component: string | null | undefined;
}
// export interface NetworkConnection {
//   rtt: number;
//   type: string;
//   saveData: boolean;
//   downLink: number;
//   effectiveType: string;
// }
export interface TrackEventData {
  eventData?: any;
  elementName?: string | null | undefined;
  componentName?: string | null | undefined;
}
