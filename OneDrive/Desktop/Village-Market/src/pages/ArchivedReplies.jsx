import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ArchivedReplies() {
    const navigate = useNavigate();
    const [responses, setResponses] = useState([]);

    useEffect(() => {
        fetchArchivedResponses();
    }, []);

    const fetchArchivedResponses = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const res = await fetch(`/api/user/responses/archived?user_id=${user.id}`);
            const data = await res.json();
            setResponses(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container">
            <div className="header">
                <ArrowLeft onClick={() => navigate(-1)} style={{ cursor: 'pointer' }} />
                <span>Archived Replies</span>
            </div>
            <div className="content">
                {responses.length === 0 && <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>No archived replies.</p>}
                {responses.map(response => (
                    <div key={response.id} className="card" style={{ borderLeft: '4px solid #999', marginBottom: '1rem' }} onClick={() => navigate(`/shop/${response.shop_id}`)}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {response.image && <img src={response.image} alt={response.product_name} style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />}
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0 }}>{response.product_name}</h4>
                                <p style={{ margin: '2px 0', fontSize: '0.9rem' }}>₹{response.price}</p>
                                <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#666' }}>{response.shop_name} replied</p>
                                {response.note && <p style={{ margin: '2px 0', fontSize: '0.8rem', fontStyle: 'italic' }}>"{response.note}"</p>}
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', color: '#999' }}>Archived on {new Date(response.timestamp).toLocaleDateString()}</p>
                            </div>
                            <button className="btn btn-sm btn-secondary" style={{ height: 'fit-content' }}>View</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
