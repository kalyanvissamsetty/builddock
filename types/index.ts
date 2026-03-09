export interface Project {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
}
export type Role = "ADMIN" | "MANAGER" | "DEV" | "VIEWER";

export type Me = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export interface Environment {
  id: number;
  name: string;
  slug: string;
  projectId: number;
  createdAt: string;
}
export interface Version {
  id: number;
  name: string;
  environmentId: number;
  s3Path: string;
  isActive: boolean;
  createdAt: string;
}

export interface AssignedBuild {
  id: number;
  version: {
    id: number;
    name: string;
    environment: {
      id: number;
      name: string;
      slug: string;
      project: {
        id: number;
        name: string;
        slug: string;
      };
    };
  };
}

export interface UploadBuildResponse  {
  success: boolean;
  publicUrl: string;
  message: string;
  extractedPath: string;
  isThisVersionDefault: boolean;
};