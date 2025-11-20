import { ReactNode } from "react";

export enum UserRole {
  PLAYER = 'PLAYER',
  OWNER = 'OWNER'
}

export interface NavItem {
  label: string;
  path: string;
}

export interface FeatureProps {
  title: string;
  description: string;
  icon: ReactNode;
  image?: string;
}

export interface StatProps {
  value: string;
  label: string;
  suffix?: string;
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

export interface RouteConfig {
  path: string;
  element: ReactNode;
}