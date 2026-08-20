export enum MenuCategory {
  ENTRADAS = 'ENTRADAS',
  SALADAS = 'SALADAS',
  MASSAS = 'MASSAS',
  PRINCIPAIS = 'PRINCIPAIS',
  CARNES = 'CARNES',
  FRUTOS_DO_MAR = 'FRUTOS_DO_MAR',
  SOBREMESAS = 'SOBREMESAS',
  BEBIDAS = 'BEBIDAS',
}

export const MENU_CATEGORY_LABELS: Record<MenuCategory, string> = {
  [MenuCategory.ENTRADAS]: 'Entradas',
  [MenuCategory.SALADAS]: 'Saladas',
  [MenuCategory.MASSAS]: 'Massas',
  [MenuCategory.PRINCIPAIS]: 'Principais',
  [MenuCategory.CARNES]: 'Carnes',
  [MenuCategory.FRUTOS_DO_MAR]: 'Frutos do Mar',
  [MenuCategory.SOBREMESAS]: 'Sobremesas',
  [MenuCategory.BEBIDAS]: 'Bebidas',
}

export enum MenuItemStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const MENU_ITEM_STATUS_LABELS: Record<MenuItemStatus, string> = {
  [MenuItemStatus.ACTIVE]: 'Ativo',
  [MenuItemStatus.INACTIVE]: 'Inativo',
}
