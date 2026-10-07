export type SlackConversation = {
    id: string;
    name: string;
    is_private: boolean;
    is_member: boolean;
};

export type SlackConversationsListResponse = {
    ok: boolean;
    error?: string;
    channels?: SlackConversation[];
    response_metadata?: { next_cursor?: string };
};

export type SlackChannel = {
    id: string;
    name: string;
    isPrivate: boolean;
    isMember: boolean;
};