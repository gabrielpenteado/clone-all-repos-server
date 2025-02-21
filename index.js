const express = require('express');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');

const app = express();
const git = simpleGit();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const getPublicRepos = async (user) => {
    try {
        const response = await axios.get(`https://api.github.com/users/${user}/repos?type=public&per_page=100`);
        return response.data;
    } catch (error) {
        throw new Error('Erro ao buscar repositórios do GitHub');
    }
};

app.post('/', async (req, res) => {
    const { user, targetDir } = req.body;

    const absolutePath = path.resolve(targetDir);


    if (!user || !absolutePath) {
        return res.status(400).json({ error: 'User and targetDir are required.' });
    }

    const repos = await getPublicRepos(user);

    if (repos.length === 0) {
        return res.status(404).json({ error: 'No public repositories found for this user.' });
    }


    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
    }

    try {
        for (const repo of repos) {
            const repoUrl = repo.clone_url;
            const repoName = repo.name;
            const cloneDir = path.join(absolutePath, repoName);

            if (!fs.existsSync(cloneDir)) {
                console.log(`Clonando o repositório ${repoName}...`);
                await git.clone(repoUrl, cloneDir);
            } else {
                console.log(`O repositório ${repoName} já foi clonado.`);
            }
        }

        res.status(200).json({ message: 'Todos os repositórios foram clonados com sucesso!' });
    } catch (error) {
        console.error('Erro ao clonar os repositórios:', error);
        res.status(500).json({ error: 'Erro ao clonar os repositórios' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
