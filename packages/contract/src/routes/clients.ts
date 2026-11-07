import {
  ClientDto,
  ClientIdInput,
  CreateClientInput,
  CreateRepoConnectionInput,
  RepoConnectionDto,
  RepoConnectionIdInput,
  RepoConnectionVerificationDto,
  RevokeRepoConnectionInput,
  RotateRepoConnectionInput,
  UpdateClientInput,
  UpdateRepoConnectionInput,
} from "../dto/clients.js";
import { Page, PageQuery } from "../dto/common.js";
import { route } from "./route.js";

const tag = "Clients and repos";

export const clients = {
  list: route(8, "GET", "/api/clients", tag, "List clients")
    .input(PageQuery)
    .output(Page(ClientDto)),
  create: route(9, "POST", "/api/clients", tag, "Create a client")
    .input(CreateClientInput)
    .output(ClientDto),
  get: route(10, "GET", "/api/clients/{clientId}", tag, "One client")
    .input(ClientIdInput)
    .output(ClientDto),
  update: route(11, "PATCH", "/api/clients/{clientId}", tag, "Edit a client")
    .input(UpdateClientInput)
    .output(ClientDto),
};

export const repoConnections = {
  list: route(12, "GET", "/api/repo-connections", tag, "List connections")
    .input(PageQuery)
    .output(Page(RepoConnectionDto)),
  create: route(
    13,
    "POST",
    "/api/repo-connections",
    tag,
    "One per client, with a read token and a write token limited to that client's repos. **Step-up.**",
    { stepUp: true },
  )
    .input(CreateRepoConnectionInput)
    .output(RepoConnectionDto),
  update: route(
    14,
    "PATCH",
    "/api/repo-connections/{connectionId}",
    tag,
    "Edit its `repos[]`. **Step-up.**",
    { stepUp: true },
  )
    .input(UpdateRepoConnectionInput)
    .output(RepoConnectionDto),
  revoke: route(
    15,
    "DELETE",
    "/api/repo-connections/{connectionId}",
    tag,
    "Revokes both tokens; the record stays for history",
  )
    .input(RevokeRepoConnectionInput)
    .output(RepoConnectionDto),
  verify: route(
    16,
    "POST",
    "/api/repo-connections/{connectionId}/verifications",
    tag,
    "Checks both tokens and their scopes",
  )
    .input(RepoConnectionIdInput)
    .output(RepoConnectionVerificationDto),
  rotate: route(
    17,
    "POST",
    "/api/repo-connections/{connectionId}/rotations",
    tag,
    "Replaces the read or the write token without changing the connection. **Step-up.**",
    { stepUp: true },
  )
    .input(RotateRepoConnectionInput)
    .output(RepoConnectionDto),
};
