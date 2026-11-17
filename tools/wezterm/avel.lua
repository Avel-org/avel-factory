-- tools/wezterm/avel.lua: the AVEL build team's control room in WezTerm.
--
-- Loaded from your personal ~/.wezterm.lua (on Windows: C:\Users\<you>\.wezterm.lua) over
-- \\wsl.localhost, so the roster changes in a reviewed PR and your theme never does.
-- See section 6 of that file for the loader.
--
-- Leader then v (or leader then Shift+A) opens the "avel" workspace: six tabs, one seat per pane.
--   1 OSA        the operator agent (.agents/system/osa.md)
--   2 AXIS       backend lead (.agents/system/axis.md), in ../avel-factory-wt/axis
--   3 ZERO       frontend lead (.agents/system/zero.md), in ../avel-factory-wt/zero
--   4 BACKEND    SOAP | RIGG      builder | checker
--   5 FRONTEND   FANTEM | FENN    builder | checker
--   6 OPS        POSTGRES over OPS (your shell)
--
-- Builder and checker panes run the lane loop (scripts/agents/lane.sh, ticket T-B0): it asks
-- scripts/dispatch.sh for that agent's next ready task doc and opens it in the pane, one fresh
-- session per dispatch (Build rules D1). Nothing is typed in and nothing is resumed.
-- Leader then s opens one task doc by hand in its own tab (scripts/agent.sh).
-- Leader then a lists every seat with its status. Tabs get a badge from the session hooks
-- (scripts/hooks/session.py): a dot when a session needs you, a tick when a turn is done.
--
-- WSL note: WezTerm drops `cwd` for tabs and splits on WSL domains, so every command cds itself.
-- No key is ever in this file: each seat's shell loads its own key file (Build roster and environment.md).

local wezterm = require 'wezterm'
local act = wezterm.action

local M = {}

local DEFAULTS = {
  repo = '/home/jt0629/projects/factory',
  domain = 'WSL:Ubuntu',
  osa_cmd = [[claude --model opus -n OSA --append-system-prompt "$(cat .agents/system/osa.md)"]], -- OSA: Claude with .agents/system/osa.md as its system prompt
  lead_model = 'opus',
  -- The building seats. Each name must match .claude/agents/<name>.md.
  agents = {
    backend = { builder = 'soap', checker = 'rigg' },
    frontend = { builder = 'fantem', checker = 'fenn' },
  },
  -- Your palette, for the picker and switcher text.
  colors = { bg = '#0b0b0e', fg = '#c9c9d1', muted = '#6e6e7a', red = '#e0555e' },
}

local o = DEFAULTS -- replaced by apply()

-- Tab colours by team. A tab's team comes from the first word of its title.
local TEAM_COLOR = {
  operator = '#e0a46d', -- amber: OSA
  leads    = '#e8cb85', -- yellow: Axis and Zero
  backend  = '#9cb0d4', -- steel blue
  frontend = '#a9c8a4', -- sage green
  review   = '#c4b8ea', -- violet: Zane, on call
  ops      = '#c9c9d1', -- silver: your shell
}

local function team_of(word)
  word = (word or ''):lower()
  if word == 'osa' then return 'operator' end
  if word == 'axis' or word == 'zero' then return 'leads' end
  if word == 'backend' or word == o.agents.backend.builder or word == o.agents.backend.checker then return 'backend' end
  if word == 'frontend' or word == o.agents.frontend.builder or word == o.agents.frontend.checker then return 'frontend' end
  if word == 'zane' then return 'review' end
  if word == 'ops' or word == 'postgres' then return 'ops' end
  return nil
end

-- Who can be opened by hand, for the picker.
local function roles()
  local b, f = o.agents.backend, o.agents.frontend
  return {
    { b.builder, 'backend', 'backend builder' },
    { b.checker, 'backend', 'backend tests and review' },
    { f.builder, 'frontend', 'frontend builder' },
    { f.checker, 'frontend', 'frontend tests and review' },
    { 'zane', 'review', 'security review, full rigor (on call)' },
    { 'axis', 'leads', 'second review on a frontend full-rigor PR' },
    { 'zero', 'leads', 'second review on a backend full-rigor PR' },
  }
end

-- What each seat does, for the switcher.
local SEAT_ROLE = {
  osa = 'operator agent: runs the cycle', axis = 'backend lead', zero = 'frontend lead',
  postgres = 'local Postgres', ops = 'you: your own shell', zane = 'security review (on call)',
}

-- ------------------------------------------------------------
-- Commands
-- ------------------------------------------------------------

-- bash -lc skips ~/.bashrc, so nvm (and node, which the hooks need) isn't on PATH. Load it first.
local NVM = '[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"; '

local function q(s) return "'" .. tostring(s):gsub("'", "'\\''") .. "'" end

local function cd(dir, fallback)
  local s = 'cd ' .. q(dir)
  if fallback then s = s .. ' 2>/dev/null || cd ' .. q(fallback) end
  return s .. " || { echo 'avel: cannot cd to " .. (dir:gsub("'", '')) .. "'; exec bash; }; "
end

-- Every seat: cd, name itself (the hooks and the switcher read AVEL_SEAT), run, then stay a shell.
local function shell(name, dir, body, fallback)
  return { 'bash', '-lc', NVM .. cd(dir, fallback) .. 'export AVEL_SEAT=' .. q(name) .. '; ' .. body .. '; exec bash' }
end

local function seat_tabs()
  local r, b, f = o.repo, o.agents.backend, o.agents.frontend

  -- A lead loads its system prompt from its own checkout. Until the file is there, it starts without it.
  local function lead(name)
    local file = '.agents/system/' .. name .. '.md'
    local claude = 'claude --model ' .. o.lead_model .. ' -n ' .. name:upper()
    return shell(name:upper(), r .. '-wt/' .. name,
      'if [ -f ' .. file .. ' ]; then ' .. claude .. ' --append-system-prompt "$(cat ' .. file .. ')"; '
        .. 'else echo "avel: ' .. file .. ' is not in this checkout yet, so ' .. name:upper() .. ' starts without it."; '
        .. claude .. '; fi', r)
  end

  -- A builder or checker seat runs the lane loop. Until T-B0 lands, it stays a shell.
  local function lane(lane_name, role, agent)
    -- Permissions come from the repo's .claude/settings.json allowlist (Build rules D7).
    return shell(agent:upper(), r,
      'if [ -x scripts/agents/lane.sh ]; then scripts/agents/lane.sh ' .. lane_name .. ' ' .. agent .. '; '
        .. 'else echo "' .. agent:upper() .. ' (' .. lane_name .. ' ' .. role
        .. '): waiting for scripts/agents/lane.sh, which arrives with ticket T-B0."; fi')
  end

  local osa = o.osa_cmd .. ' || echo "avel: OSA did not start with: ' .. (o.osa_cmd:gsub('"', '')) .. '"'

  -- { tab title, { { seat name, command, split direction }, ... } }
  return {
    { 'OSA', { { 'OSA', shell('OSA', r, osa) } } },
    { 'AXIS', { { 'AXIS', lead('axis') } } },
    { 'ZERO', { { 'ZERO', lead('zero') } } },
    { 'BACKEND', {
      { b.builder:upper(), lane('backend', 'builder', b.builder) },
      { b.checker:upper(), lane('backend', 'checker', b.checker), 'Right' },
    } },
    { 'FRONTEND', {
      { f.builder:upper(), lane('frontend', 'builder', f.builder) },
      { f.checker:upper(), lane('frontend', 'checker', f.checker), 'Right' },
    } },
    { 'OPS', {
      { 'POSTGRES', shell('POSTGRES', r, '[ -x scripts/pg-local.sh ] && scripts/pg-local.sh start') },
      { 'OPS', shell('OPS', r, 'git status -sb'), 'Bottom' },
    } },
  }
end

-- ------------------------------------------------------------
-- Opening the control room
-- ------------------------------------------------------------

local function domain() return { DomainName = o.domain } end

-- Which seat each pane is, by pane id. Kept in GLOBAL so it survives a config reload.
local function remember(pane, name)
  local seats = wezterm.GLOBAL.avel_seats or {}
  seats[tostring(pane:pane_id())] = name
  wezterm.GLOBAL.avel_seats = seats
end

local function seat_of(pane_id)
  return (wezterm.GLOBAL.avel_seats or {})[tostring(pane_id)]
end

local function open_tab(win, spec)
  local title, panes = spec[1], spec[2]
  local tab, pane, new_win
  if win then
    tab, pane = win:spawn_tab({ domain = domain(), args = panes[1][2] })
  else
    tab, pane, new_win = wezterm.mux.spawn_window({ workspace = 'avel', domain = domain(), args = panes[1][2] })
  end
  tab:set_title(title)
  remember(pane, panes[1][1])
  for i = 2, #panes do
    local p = panes[i]
    remember(pane:split({ direction = p[3] or 'Right', size = 0.5, args = p[2] }), p[1])
  end
  return tab, new_win or win
end

local function open_now(window, pane)
  -- What's already open in the avel workspace, by tab title. Only missing tabs are added.
  local win, open = nil, {}
  for _, w in ipairs(wezterm.mux.all_windows()) do
    if w:get_workspace() == 'avel' then
      win = win or w
      for _, t in ipairs(w:tabs()) do open[t:get_title()] = t end
    end
  end
  for _, spec in ipairs(seat_tabs()) do
    if not open[spec[1]] then
      local t
      t, win = open_tab(win, spec)
      open[spec[1]] = t
    end
  end
  window:perform_action(act.SwitchToWorkspace({ name = 'avel' }), pane)
  if open.OSA then open.OSA:activate() end
  -- New windows open at 80x24, far too small for the seats.
  wezterm.time.call_after(1, function()
    for _, gw in ipairs(wezterm.gui.gui_windows()) do
      if gw:active_workspace() == 'avel' then gw:maximize() end
    end
  end)
end

local function toast(window, text) window:toast_notification('avel', text, nil, 8000) end

-- Any error shows as a notification (and in the log) instead of failing silently.
local function open(window, pane)
  local ok, err = pcall(open_now, window, pane)
  if not ok then
    wezterm.log_error('avel: control room failed: ' .. tostring(err))
    toast(window, 'Control room failed: ' .. tostring(err))
  end
end

-- ------------------------------------------------------------
-- Attention: badges and toasts from the session hooks
-- ------------------------------------------------------------
-- scripts/hooks/session.py keeps each Claude session's state in the repo's
-- .git/avel/sessions.json, keyed by its WezTerm pane ($WEZTERM_PANE):
--   { "<pane id>": { "name": "SOAP T-B3-build a1", "state": "active|waiting|idle", "since": "...", "msg": "..." } }
-- Once a second this reads it over \\wsl.localhost and:
--   waiting  toasts "<NAME> needs you" once, and badges the tab with a dot until it's answered
--   idle     badges the tab with a tick until you look at it; a finished dispatch also toasts

local BADGE = { waiting = { '● ', '#f2c662' }, done = { '✓ ', '#68d3a0' } }

local function sessions_file()
  local distro = o.domain:match('^WSL:(.+)$') or 'Ubuntu'
  return '\\\\wsl.localhost\\' .. distro .. (o.repo:gsub('/', '\\')) .. '\\.git\\avel\\sessions.json'
end

local function read_sessions()
  local f = io.open(sessions_file(), 'r')
  if not f then return nil end
  local text = f:read('*a')
  f:close()
  local ok, data = pcall(wezterm.json_parse, text)
  if ok and type(data) == 'table' then return data end
  return nil
end

function M.attention(window)
  local data = read_sessions()
  if not data then
    wezterm.GLOBAL.avel_badges = {}
    return
  end
  local looking = {}
  if window:is_focused() then
    local t = window:active_tab()
    if t then
      for _, p in ipairs(t:panes()) do looking[tostring(p:pane_id())] = true end
    end
  end
  local toasted = wezterm.GLOBAL.avel_toasted or {}
  local seen = wezterm.GLOBAL.avel_seen or {}
  local badges = {}
  for id, s in pairs(data) do
    if type(s) == 'table' then
      local ok, pane = pcall(wezterm.mux.get_pane, tonumber(id))
      local seat = seat_of(id)
      local name = tostring(s.name or '')
      -- Skip a pane that's gone, or an entry left over from a pane id WezTerm has since reused.
      if ok and pane and (not seat or name:sub(1, #seat) == seat) then
        local since = tostring(s.since or '')
        local key = id .. ' ' .. since
        if s.state == 'waiting' then
          badges[id] = 'waiting'
          if not toasted[key] then
            toasted[key] = true
            local msg = (s.msg and s.msg ~= '') and s.msg or 'waiting for you'
            window:toast_notification((name ~= '' and name or 'A session') .. ' needs you', msg, nil, 10000)
          end
        elseif s.state == 'idle' then
          if looking[id] then seen[id] = since end
          if seen[id] ~= since then
            badges[id] = 'done'
            if name:find(' a%d+$') and not toasted[key] then
              toasted[key] = true
              window:toast_notification(name .. ' finished', 'Its turn is done: read the completion report', nil, 6000)
            end
          end
        end
      end
    end
  end
  wezterm.GLOBAL.avel_toasted = toasted
  wezterm.GLOBAL.avel_seen = seen
  wezterm.GLOBAL.avel_badges = badges
end

local function tab_badge(tab_id)
  local badges = wezterm.GLOBAL.avel_badges
  if not badges then return nil end
  local ok, mux_tab = pcall(wezterm.mux.get_tab, tab_id)
  if not ok or not mux_tab then return nil end
  local found
  for _, p in ipairs(mux_tab:panes()) do
    local b = badges[tostring(p:pane_id())]
    if b == 'waiting' then return 'waiting' end
    found = found or b
  end
  return found
end

local function format_tab_title(tab, _, _, _, _, max_width)
  local title = tab.tab_title
  if not title or title == '' then title = tab.active_pane.title end
  local badge = BADGE[tab_badge(tab.tab_id) or '']
  local text = wezterm.truncate_right(title, max_width - 2 - (badge and 2 or 0)) .. ' '
  local team = team_of(title:match('^(%a+)'))
  local color = team and TEAM_COLOR[team]
  local out = {}
  if tab.is_active and color then table.insert(out, { Background = { Color = color } }) end
  table.insert(out, { Text = ' ' })
  if badge then
    table.insert(out, { Foreground = { Color = (tab.is_active and color) and o.colors.bg or badge[2] } })
    table.insert(out, { Text = badge[1] })
  end
  if color then table.insert(out, { Foreground = { Color = tab.is_active and o.colors.bg or color } }) end
  table.insert(out, { Text = text })
  return out
end

-- ------------------------------------------------------------
-- Picker: leader then s
-- ------------------------------------------------------------
-- Pick an agent, then one of its rendered task docs, and scripts/agent.sh opens it in its own tab:
-- a fresh worktree, the next attempt number, the Build rules limits (4 sessions at most, B7).
-- For a review, agent.sh reads the builder's commit from its completion report.
--   scripts/agent.sh --docs <agent>   prints  <lane>\t<sprint>\t<task doc>\t<next attempt>  per ready doc
--   scripts/agent.sh <lane> <sprint> <task doc> <attempt>   opens it, and prints one line for the toast

local function wsl(cmd)
  local distro = o.domain:match('^WSL:(.+)$') or 'Ubuntu'
  local ok, out, err = wezterm.run_child_process({
    'wsl.exe', '-d', distro, '--', 'bash', '-lc', NVM .. 'cd ' .. q(o.repo) .. ' && ' .. cmd,
  })
  local text = (out or '') .. (err or '')
  return ok, (text:gsub('%s+$', ''))
end

local function launch(window, lane, sprint, doc, attempt)
  local _, out = wsl(string.format('scripts/agent.sh %s %s %s %s', q(lane), q(sprint), q(doc), q(attempt)))
  toast(window, out ~= '' and out or 'agent.sh gave no output')
end

local function pick_doc(window, pane, agent)
  local ok, out = wsl('[ -x scripts/agent.sh ] || { echo "scripts/agent.sh arrives with ticket T-B0."; exit 1; }; '
    .. 'scripts/agent.sh --docs ' .. q(agent))
  if not ok then return toast(window, out) end
  local choices = {}
  for line in out:gmatch('[^\r\n]+') do
    local lane, sprint, doc, n = line:match('^(%S+)\t(%S+)\t(%S+)\t(%d+)$')
    if lane then
      table.insert(choices, {
        id = table.concat({ lane, sprint, doc, n }, '\t'),
        label = string.format('%-9s %-10s %s   a%s', lane, sprint, doc, n),
      })
    end
  end
  if #choices == 0 then
    return toast(window, 'No ready task docs for ' .. agent:upper() .. '. Render the sprint first (scripts/render.py).')
  end
  window:perform_action(act.InputSelector({
    title = agent:upper() .. ': pick a task doc',
    choices = choices,
    fuzzy = true,
    action = wezterm.action_callback(function(win, _, id)
      if not id then return end
      local lane, sprint, doc, n = id:match('^(%S+)\t(%S+)\t(%S+)\t(%d+)$')
      launch(win, lane, sprint, doc, n)
    end),
  }), pane)
end

local function pick(window, pane)
  local choices = {}
  for _, a in ipairs(roles()) do
    table.insert(choices, { id = a[1], label = string.format('%-8s %-9s %s', a[1]:upper(), a[2], a[3]) })
  end
  window:perform_action(act.InputSelector({
    title = 'Open a dispatch by hand',
    choices = choices,
    fuzzy = true,
    action = wezterm.action_callback(function(win, p, id)
      if id then pick_doc(win, p, id) end
    end),
  }), pane)
end

-- ------------------------------------------------------------
-- Switcher: leader then a
-- ------------------------------------------------------------
-- Every seat in the avel workspace, one section per tab, with its status read from the title
-- Claude Code sets ("✳ NAME" is idle, a spinner glyph means it's working, plain text means
-- Claude isn't running there). Pick a seat and it opens zoomed (leader then z puts it back);
-- pick a header and its tab opens as it is.

local STATUS = {
  working = { '●', '#e8cb85', 'working' },
  idle    = { '○', '#9a9aa6', 'idle' },
  shell   = { '·', '#6e6e7a', 'no claude' },
}

local function status_of(title)
  local first = title:match('^[\1-\127\194-\244][\128-\191]*') or ''
  if first == '✳' then return 'idle' end
  if first:match('^[%w]$') or first == '' then return 'shell' end
  return 'working'
end

local function role_of(name)
  local word = (name:match('^(%a+)') or ''):lower()
  if SEAT_ROLE[word] then return SEAT_ROLE[word] end
  for _, a in ipairs(roles()) do
    if a[1] == word then return a[3] end
  end
  return ''
end

local function row(name, pane, indent)
  local st = STATUS[status_of(pane:get_title())]
  local team = team_of(name:match('^(%a+)'))
  return {
    id = 'pane:' .. pane:pane_id(),
    label = wezterm.format({
      { Text = indent },
      { Foreground = { Color = st[2] } }, { Text = st[1] .. '  ' },
      { Foreground = { Color = team and TEAM_COLOR[team] or o.colors.fg } },
      { Attribute = { Intensity = 'Bold' } }, { Text = string.format('%-22s', name) },
      { Attribute = { Intensity = 'Normal' } },
      { Foreground = { Color = o.colors.muted } }, { Text = string.format('%-38s', role_of(name)) },
      { Foreground = { Color = st[2] } }, { Text = st[3] },
    }),
  }
end

local function switch(window, pane)
  local choices = {}
  for _, w in ipairs(wezterm.mux.all_windows()) do
    if w:get_workspace() == 'avel' then
      for _, t in ipairs(w:tabs()) do
        local panes, working = t:panes(), 0
        for _, p in ipairs(panes) do
          if status_of(p:get_title()) == 'working' then working = working + 1 end
        end
        local tab_title = t:get_title()
        local team = team_of(tab_title:match('^(%a+)'))
        table.insert(choices, {
          id = 'tab:' .. panes[1]:pane_id(),
          label = wezterm.format({
            { Foreground = { Color = team and TEAM_COLOR[team] or o.colors.red } }, { Attribute = { Intensity = 'Bold' } },
            { Text = string.format('%-26s', tab_title) }, { Attribute = { Intensity = 'Normal' } },
            { Foreground = { Color = o.colors.muted } },
            { Text = string.format('%d open · %d working', #panes, working) },
          }),
        })
        for _, p in ipairs(panes) do
          local name = seat_of(p:pane_id()) or (#panes == 1 and tab_title) or (p:get_title():gsub('^[^%w]+', ''))
          table.insert(choices, row(name, p, '    '))
        end
      end
    end
  end
  if #choices == 0 then return toast(window, "The avel workspace isn't open: leader then v") end
  window:perform_action(act.InputSelector({
    title = 'avel seats    ● working   ○ idle    Enter: open   leader z: back to the tab',
    choices = choices,
    fuzzy = true,
    fuzzy_description = 'Find a seat or tab: ',
    action = wezterm.action_callback(function(win, p, id)
      if not id then return end
      local kind, pid = id:match('^(%a+):(%d+)$')
      local target = pid and wezterm.mux.get_pane(tonumber(pid))
      if not target then return end
      if win:active_workspace() ~= 'avel' then
        win:perform_action(act.SwitchToWorkspace({ name = 'avel' }), p)
      end
      local tab = target:tab()
      if tab then tab:set_zoomed(false) end
      target:activate()
      if kind == 'pane' and tab and #tab:panes() > 1 then tab:set_zoomed(true) end
    end),
  }), pane)
end

-- ------------------------------------------------------------
-- apply
-- ------------------------------------------------------------

function M.apply(config, opts)
  o = {}
  for k, v in pairs(DEFAULTS) do o[k] = v end
  for k, v in pairs(opts or {}) do o[k] = v end
  o.colors = {}
  for k, v in pairs(DEFAULTS.colors) do o.colors[k] = v end
  for k, v in pairs((opts or {}).colors or {}) do o.colors[k] = v end

  wezterm.on('format-tab-title', format_tab_title)

  -- A shell that enters the repo asks for the control room (~/.bashrc, __avel_auto): it sets the
  -- user var avel_open. Seats are in the repo too, so a seat's own request is ignored.
  wezterm.on('user-var-changed', function(window, pane, name, _)
    if name == 'avel_open' and not seat_of(pane:pane_id()) then open(window, pane) end
  end)

  config.keys = config.keys or {}
  for _, k in ipairs({
    -- Open or switch to the control room: leader then v (or leader then Shift+A)
    { key = 'v', mods = 'LEADER', action = wezterm.action_callback(open) },
    { key = 'A', mods = 'LEADER|SHIFT', action = wezterm.action_callback(open) },
    -- Open one task doc by hand, in its own tab: leader then s
    { key = 's', mods = 'LEADER', action = wezterm.action_callback(pick) },
    -- Jump to a seat, zoomed, from a list with its status: leader then a
    { key = 'a', mods = 'LEADER', action = wezterm.action_callback(switch) },
  }) do
    table.insert(config.keys, k)
  end
  return M
end

return M
