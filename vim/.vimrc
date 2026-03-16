set number relativenumber
set softtabstop=4
set shiftwidth=4
set expandtab
set autoindent
set smartindent
set hlsearch
set smartcase

" 禁用鼠标
set mouse=""

" 禁用键盘方向键
noremap <Up> <NOP>
noremap <Down> <NOP>
noremap <Left> <NOP>
noremap <Right> <NOP>

call plug#begin()

" vim 中文文档
Plug 'yianwillis/vimcdoc'

call plug#end()
