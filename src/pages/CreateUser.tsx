import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

const genderOptions = [
    { label: 'Maschio', value: 'M' },
    { label: 'Femmina', value: 'F' }
];

const CreateUser: React.FC = () => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logica di submit da implementare
        console.log({ name, gender });
    };

    return (
        <div className="p-d-flex p-jc-center p-mt-5">
            <Card title="Crea Nuovo Utente" className="p-shadow-4" style={{ width: '400px' }}>
                <form onSubmit={handleSubmit} className="p-fluid">
                    <div className="p-field p-mb-3">
                        <label htmlFor="name">Nome</label>
                        <InputText id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="p-field p-mb-3">
                        <label htmlFor="gender">Genere</label>
                        <Dropdown id="gender" value={gender} options={genderOptions} onChange={e => setGender(e.value)} placeholder="Seleziona Genere" required />
                    </div>
                    <Button type="submit" label="Crea" icon="pi pi-check" />
                </form>
            </Card>
        </div>
    );
};

export default CreateUser;
