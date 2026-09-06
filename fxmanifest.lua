fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'tc_db'
author 'tiny-core'
version '0.1.0'
description 'Camada MySQL propria para FXServer — pool, prepared statements e transacoes'

-- O runtime JS do FXServer e Node 16 por omissao; o mysql2 moderno precisa de 18+.
node_version '22'

server_script 'dist/server.js'
