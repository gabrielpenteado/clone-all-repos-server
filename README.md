# Clone-All-Repos-Server

[**Clone-All-Repos-Server**](https://github.com/gabrielpenteado/clone-all-repos-server) is a backend service that allows users to download all public repositories from a specific GitHub user. The service clones repositories, stores them temporarily on the server, creates a ZIP file, and sends it to the frontend for download. The temporary folder and the ZIP file are automatically deleted after 2 minutes.

## How it Works

The server receives a GitHub username and performs the following steps:

1. **Fetch Public Repositories**: It sends a request to the GitHub API to retrieve up to 100 public repositories for the provided username.
2. **Clone Repositories**: The server clones the repositories into a temporary directory on the server using `simple-git`.
3. **Create a ZIP File**: After all repositories are cloned, the server compresses them into a single ZIP file using the `archiver` module.
4. **Send ZIP for Download**: The ZIP file is made available for download via a response to the frontend.
5. **Automated Cleanup**: After 2 minutes, both the temporary folder and the ZIP file are deleted from the server to ensure efficient resource management.

## Technologies

**Node.js** |
**Express** |
**Archiver** (File Compression) |
**Axios** |
**FS** (File System Operations) |
**Simple-Git** (Git Integration)

## How to Use

1. Send a **POST** request to `/` with a JSON body containing the GitHub username. (string)
2. Receive a downloadable ZIP file containing all the public repositories.

### Example Request

```json
{
  "user": "username"
}
```

## 🤝 Contributions

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)<br>
The foundation of the open source community are the contributions, them inspire us to learn and create. Any contributions are greatly appreciated.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE.md](https://github.com/gabrielpenteado/clone-all-repos-server/blob/main/LICENSE.md) file for details.
<br>
<br>

<div align="center">
  <img src="https://images.weserv.nl/?url=avatars.githubusercontent.com/u/63300269?v=4&h=100&w=100&fit=cover&mask=circle&maxage=7d" />
  <h1>Gabriel Penteado</h1>
  <strong>Full Stack Software Engineer</strong>
  <br/>
  <br/>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/gabriel-penteado)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/gabrielpenteado)
[![Gmail](https://img.shields.io/badge/gabripenteado@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:gabripenteado@gmail.com)
<br />
<br />

</div>
