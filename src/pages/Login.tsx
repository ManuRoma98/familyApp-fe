import "./Login.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { FloatLabel } from "primereact/floatlabel";
import { Password } from "primereact/password";

import 'primereact/resources/themes/lara-dark-amber/theme.css'; //theme
import 'primereact/resources/primereact.min.css'; //core css
import 'primeicons/primeicons.css'; //icons
import 'primeflex/primeflex.css'; // flex

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setError(null);
        const success = await login(username, password);
        if (success) {
            navigate("/dashboard");
        } else {
            setError("Credenziali errate!");
        }
    };

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <div className="fade-in-up">
                <div className="flex flex-column align-items-center justify-content-center">
                    <img src="src\images\babba.jpeg" className="mb-5 w-6rem flex-shrink-0 border-circle"/>
                    <div className="shadow-7 border-round-3xl" style={{ background: 'linear-gradient(130deg, var(--primary-color) 35%, #242424 60%)' }}>
                        <div className="border-round-3xl py-8 px-5 sm:px-8" style={{ position: 'relative', margin:'5px', width: '99%', maxWidth: '420px', background: 'linear-gradient(130deg, var(--primary-color) 5%, #242424 45%)' }}>
                            <div className="text-center mb-5">
                                <div className="text-3xl font-medium mb-3">
                                    Ciao Babba!
                                </div>
                                <span className="font-medium">Se non ricordi la password chiedimela (pirla)</span>
                            </div>
                        
                            <div className="block bg-primary font-bold text-center border-round mb-3">
                                {error && <p className="error">{error}</p>}
                            </div>
                            
                            <div className="grid p-fluid">
                                <div className="col-12 md:col-12 mb-3">
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-user" />
                                        </span>
                                        <FloatLabel>
                                            <InputText id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                                            <label className="font-bold block text-center mb-3" htmlFor="username">Username</label>
                                        </FloatLabel>
                                        
                                    </div>
                                </div>

                                <div className="col-12 md:col-12 mb-6">
                                    <div className="p-inputgroup">
                                        <span className="p-inputgroup-addon">
                                            <i className="pi pi-key" />
                                        </span>
                                        <FloatLabel>
                                            <Password inputStyle={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, width: '100%' }} id="password" value={password} onChange={(e) => setPassword(e.target.value)} toggleMask feedback={false} />
                                            <label className="font-bold block text-center mb-3" htmlFor="password">Password</label>
                                        </FloatLabel>
                                    </div>
                                </div>
                            </div>
        
                            <div className="block bg-primary font-bold text-center border-round">
                                <Button onClick={handleLogin}>Login</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
