import { AppError } from "@/core/errors/AppError";
import {
  isValidListTitle,
  MAX_LIST_DESCRIPTION,
  type ListDetail,
  type ListInput,
  type ListItem,
  type ListSummary,
} from "@/domain/entities/List";
import type { SeriesDetail } from "@/domain/entities/Series";
import type { IListRepository } from "@/domain/repositories/IListRepository";
import type { EnsureSeriesCached } from "@/domain/usecases/tracking/TrackingUseCases";

function normalize(input: ListInput): ListInput {
  if (!isValidListTitle(input.title)) {
    throw new AppError("validation", "Give your list a title (1–80 characters).");
  }

  const description = input.description?.trim() || null;

  if (description && description.length > MAX_LIST_DESCRIPTION) {
    throw new AppError("validation", `Description must be ${MAX_LIST_DESCRIPTION} characters or fewer.`);
  }

  return { title: input.title.trim(), description, isPrivate: input.isPrivate };
}

export class GetUserLists {
  constructor(private readonly lists: IListRepository) {}

  async execute(userId: string): Promise<ListSummary[]> {
    return this.lists.getUserLists(userId);
  }
}

export class GetList {
  constructor(private readonly lists: IListRepository) {}

  async execute(listId: string): Promise<ListDetail | null> {
    return this.lists.getList(listId);
  }
}

export class GetListItems {
  constructor(private readonly lists: IListRepository) {}

  async execute(listId: string): Promise<ListItem[]> {
    return this.lists.getListItems(listId);
  }
}

export class CreateList {
  constructor(private readonly lists: IListRepository) {}

  async execute(input: ListInput): Promise<string> {
    return this.lists.createList(normalize(input));
  }
}

export class UpdateList {
  constructor(private readonly lists: IListRepository) {}

  async execute(listId: string, input: ListInput): Promise<void> {
    return this.lists.updateList(listId, normalize(input));
  }
}

export class DeleteList {
  constructor(private readonly lists: IListRepository) {}

  async execute(listId: string): Promise<void> {
    return this.lists.deleteList(listId);
  }
}

export class AddToList {
  constructor(
    private readonly lists: IListRepository,
    private readonly ensureCached: EnsureSeriesCached
  ) {}

  async execute(listId: string, tmdbId: number, detail?: SeriesDetail): Promise<void> {
    const { seriesId } = await this.ensureCached.execute(tmdbId, detail);
    await this.lists.addItem(listId, seriesId);
  }
}

export class RemoveFromList {
  constructor(private readonly lists: IListRepository) {}

  async execute(listId: string, seriesId: string): Promise<void> {
    return this.lists.removeItem(listId, seriesId);
  }
}
