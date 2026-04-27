import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuthStore from '../../store/authStore';
import StudentQuestionsPanel from '../../components/StudentQuestionsPanel';

const TeacherQuestions = () => {
    const { token } = useAuthStore();
    const API_URL = import.meta.env.VITE_API_URL || '';
    const [trades, setTrades] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/course-notes/trades`).then(r => setTrades(r.data)).catch(() => {});
    }, [API_URL]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Ibibazo by'Abanyeshuri</h1>
                <p className="text-gray-500 text-sm">Subiza ibibazo bashyize ku rubuga rwa Kwiga.</p>
            </div>
            <StudentQuestionsPanel apiUrl={API_URL} token={token} trades={trades} />
        </div>
    );
};

export default TeacherQuestions;
