const express = require('express');
const simpleGit = require('simple-git');
const fsPromises = require('fs').promises;
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const archiver = require('archiver');
const rimraf = require('rimraf');
const cors = require('cors');


const app = express();
const git = simpleGit();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Função para buscar repositórios públicos no GitHub
const getPublicRepos = async (user) => {
    try {
        const response = await axios.get(`https://api.github.com/users/${user}/repos?type=public&per_page=100`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching GitHub repositories');
    }
};

// Rota para clonar os repositórios e gerar o arquivo ZIP
app.post('/', async (req, res) => {
    const { user } = req.body;

    if (!user) {
        return res.status(400).json({ error: 'User is required.' });
    }

    try {
        const repos = await getPublicRepos(user);

        if (repos.length === 0) {
            return res.status(404).json({ error: 'No public repositories found for this user.' });
        }

        // 1. Criar uma pasta temporária dentro da raiz do projeto
        const tempDirPath = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDirPath)) {
            fs.mkdirSync(tempDirPath);
        }

        // 2. Clonar todos os repositórios na pasta temporária
        for (const repo of repos) {
            const repoUrl = repo.clone_url;
            const repoName = repo.name;
            const cloneDir = path.join(tempDirPath, repoName);

            if (!fs.existsSync(cloneDir)) {
                console.log(`Clonando o repositório ${repoName}...`);
                await git.clone(repoUrl, cloneDir);
                console.log(`Repositório ${repoName} clonado com sucesso.`);
            } else {
                console.log(`Repositório ${repoName} já clonado.`);
            }
        }

        // 3. Criar o arquivo ZIP com os repositórios clonados (ou todas as pastas dentro da pasta temp)
        const zipFilePath = path.join(__dirname, `${user}_repos.zip`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Conectar o arquivo ZIP ao stream de saída
        archive.pipe(output);

        // Ler todas as pastas dentro da pasta temp
        fs.readdirSync(tempDirPath).forEach((item) => {
            const fullPath = path.join(tempDirPath, item);

            // Verificar se é uma pasta (não um arquivo)
            if (fs.statSync(fullPath).isDirectory()) {
                archive.directory(fullPath, item); // Adiciona a pasta ao arquivo ZIP
            }
        });

        // Finalizar a criação do ZIP
        archive.finalize();

        // Quando o ZIP for gerado, enviar o arquivo para o frontend
        output.on('close', () => {
            res.setHeader('Content-Disposition', `attachment; filename=${user}_repos.zip`);
            res.download(zipFilePath, `${user}_repos.zip`, (err) => {
                if (err) {
                    console.error('Erro ao enviar o arquivo ZIP:', err);
                    return res.status(500).json({ error: 'Erro ao enviar o arquivo ZIP' });
                }

                fsPromises.rm(tempDirPath, { recursive: true })
                    .then(() => {
                        console.log('Pasta temporária excluída com sucesso.');
                    })
                    .catch(err => {
                        console.error('Erro ao excluir a pasta temporária:', err);
                    });
            });
        });

        // 5. Configurar timeout para excluir o arquivo ZIP após 1 minuto
        setTimeout(() => {
            fsPromises.rm(zipFilePath, { force: true })
                .then(() => {
                    console.log(`Arquivo ZIP ${zipFilePath} excluído após 1 minuto.`);
                })
                .catch(err => {
                    console.error('Erro ao excluir o arquivo ZIP após 1 minuto:', err);
                });
        }, 60000); // 60000 ms = 1 minuto


    } catch (error) {
        console.error('Erro ao clonar os repositórios:', error);
        res.status(500).json({ error: 'Erro ao clonar os repositórios' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
