import KeyComponent from "./key_component";
import LoginComponent from "./login_component";

export default function Settings() {
    return (
        <main>
            <h1 className="text-3xl font-bold">
                Settings
            </h1>

            <KeyComponent />
            <LoginComponent />
        </main>
    )
}