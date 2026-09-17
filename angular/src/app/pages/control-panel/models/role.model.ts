export interface Role {

  id: number;

  roleName: string;

  recommendedPermission: string;

  permissions: {

    [module: string]: string[];

  };

}