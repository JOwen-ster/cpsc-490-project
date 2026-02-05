export default async function GitHubLoginButton() {
    return (
        <div className="flex justify-center">
            <a
                href="https://www.github.com"
                target="_blank" rel="nofollow noopener noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-black bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-500 ease-in-out hover:bg-white hover:text-black"
            >
                <span>Login with GitHub</span>
            </a>
        </div>
    );
}