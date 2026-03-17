local wezterm = require 'wezterm'
local config = wezterm.config_builder()

config.initial_cols = 120
config.initial_rows = 30
config.color_scheme = 'Catppuccin Mocha'
config.window_decorations = 'RESIZE'
config.use_fancy_tab_bar = false
config.window_background_opacity = 0.92
config.text_background_opacity = 0.92
config.window_close_confirmation = 'NeverPrompt'
config.font = wezterm.font_with_fallback {
  'Maple Mono NF CN',
  'Jetbrains Mono',
  'Consolas',
}

config.default_prog = { 'pwsh.exe', '-NoLogo' }
config.launch_menu = {
  {
    label = 'PowerShell',
    args = { 'powershell.exe', '-NoLogo' },
  },
  {
    label = 'PowerShell 7',
    args = { 'pwsh.exe', '-NoLogo' },
  },
}

return config
