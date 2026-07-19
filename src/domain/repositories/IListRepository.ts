import type { ListDetail, ListInput, ListItem, ListSummary } from "../entities/List";

export interface IListRepository {
  getUserLists(userId: string): Promise<ListSummary[]>;
  getList(listId: string): Promise<ListDetail | null>;
  getListItems(listId: string): Promise<ListItem[]>;
  createList(input: ListInput): Promise<string>;
  updateList(listId: string, input: ListInput): Promise<void>;
  deleteList(listId: string): Promise<void>;
  addItem(listId: string, seriesId: string): Promise<void>;
  removeItem(listId: string, seriesId: string): Promise<void>;
}
