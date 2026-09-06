# Avisos de terceiros

O ficheiro distribuído `dist/server.js` é um bundle: contém o código do `tc_db` e o das
dependências abaixo. As licenças permissivas exigem que o aviso de copyright viaje com o
código distribuído — daí este ficheiro.

Regenerar sempre que as dependências mudarem, antes de publicar uma release.

---

## mysql2 — MIT
https://github.com/sidorares/node-mysql2

Copyright (c) 2016 Andrey Sidorov e contribuidores do projeto MySQL2.

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.

> As dependências transitivas do mysql2 devem ser listadas aqui também. Gerar com
> `bunx license-checker --production --summary` (ou equivalente) antes de cada release.
