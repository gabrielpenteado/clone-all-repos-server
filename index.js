const express = require('express');
const simpleGit = require('simple-git');
const fsPromises = require('fs').promises;
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const archiver = require('archiver');
const cors = require('cors');

const app = express();
const git = simpleGit();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const getPublicRepos = async (user) => {
    try {
        const response = await axios.get(`https://api.github.com/users/${user}/repos?type=public&per_page=100`);
        return response.data;
    } catch (error) {
        throw new Error('Error fetching GitHub repositories');
    }
};

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

        // Create a temporary folder inside the root of the project.
        const tempDirPath = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDirPath)) {
            fs.mkdirSync(tempDirPath);
        }

        // Clone all the repositories into the temporary folder.
        for (const repo of repos) {
            const repoUrl = repo.clone_url;
            const repoName = repo.name;
            const cloneDir = path.join(tempDirPath, repoName);

            if (!fs.existsSync(cloneDir)) {
                console.log(`Cloning the repository ${repoName}...`);
                await git.clone(repoUrl, cloneDir);
                console.log(`Repository ${repoName} cloned successfully.`);
            } else {
                console.log(`Repository ${repoName} already cloned.`);
            }
        }

        // Create the ZIP file with the cloned repositories.
        const zipFilePath = path.join(__dirname, `${user}_repos.zip`);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Connect the ZIP file to the output stream.
        archive.pipe(output);

        // Read all the folders inside the temp folder.
        fs.readdirSync(tempDirPath).forEach((item) => {
            const fullPath = path.join(tempDirPath, item);

            // Check if it is a folder (not a file).
            if (fs.statSync(fullPath).isDirectory()) {
                archive.directory(fullPath, item); // Adiciona a pasta ao arquivo ZIP
            }
        });

        archive.finalize();

        // When the ZIP is generated, send the file to the frontend.
        output.on('close', () => {
            res.setHeader('Content-Disposition', `attachment; filename=${user}_repos.zip`);
            res.download(zipFilePath, `${user}_repos.zip`, (err) => {
                if (err) {
                    console.error('Error while sending the ZIP file:', err);
                    return res.status(500).json({ error: 'Error while sending the ZIP file:' });
                }

                fsPromises.rm(tempDirPath, { recursive: true })
                    .then(() => {
                        console.log('Temporary folder deleted successfully.');
                    })
                    .catch(err => {
                        console.error('Error deleting the temporary folder:', err);
                    });
            });
        });

        // Set a timeout to delete the ZIP file after 2 minutes.
        setTimeout(() => {
            fsPromises.rm(zipFilePath, { force: true })
                .then(() => {
                    console.log(`ZIP file ${zipFilePath} deleted after 2 minutes.`);
                })
                .catch(err => {
                    console.error('Error deleting the ZIP file after 2 minutes.', err);
                });
        }, 120000); // 60000 ms = 1 minute


    } catch (error) {
        console.error('Error cloning the repositories:', error);
        res.status(500).json({ error: 'Error cloning the repositories.' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});
