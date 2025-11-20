export type AgendaLinkBuilderOptions = {
  date?: Date;
  profesionalId?: string;
  newEvent?: boolean;
};

export type AgendaLinkBuilder = (options?: AgendaLinkBuilderOptions) => string;

