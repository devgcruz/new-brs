/**
 * Exemplo de uso do Sistema de Uploads - BRS API
 * Este arquivo mostra como integrar o sistema de uploads no frontend React
 */

// ========================================
// 1. COMPONENTE DE UPLOAD DE PDF
// ========================================

import React, { useState } from 'react';

const PdfUpload = ({ entradaId, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validar tipo de arquivo
        if (file.type !== 'application/pdf') {
            setError('Apenas arquivos PDF são permitidos');
            return;
        }

        // Validar tamanho (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Arquivo muito grande. Máximo 10MB');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('entrada_id', entradaId);
            formData.append('pdf', file);
            formData.append('descricao', 'Documento enviado via sistema');

            const token = localStorage.getItem('auth_token');
            
            const response = await fetch('/api/index.php?endpoint=pdfs', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                setProgress(100);
                onUploadSuccess(data.data);
                event.target.value = ''; // Limpar input
            } else {
                setError(data.message || 'Erro no upload');
            }
        } catch (err) {
            setError('Erro de conexão: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="pdf-upload">
            <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
            />
            
            {uploading && (
                <div className="progress">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>
            )}
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
        </div>
    );
};

// ========================================
// 2. COMPONENTE DE LISTAGEM DE PDFs
// ========================================

const PdfList = ({ entradaId }) => {
    const [pdfs, setPdfs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchPdfs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/index.php?endpoint=pdfs&entrada_id=${entradaId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                setPdfs(data.data);
            }
        } catch (err) {
            console.error('Erro ao buscar PDFs:', err);
        } finally {
            setLoading(false);
        }
    };

    const deletePdf = async (pdfId) => {
        if (!confirm('Tem certeza que deseja deletar este PDF?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/index.php?endpoint=pdfs&id=${pdfId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            if (data.success) {
                fetchPdfs(); // Recarregar lista
            } else {
                alert('Erro ao deletar PDF: ' + data.message);
            }
        } catch (err) {
            console.error('Erro ao deletar PDF:', err);
        }
    };

    const openPdf = (pdf) => {
        // Abrir PDF em nova aba usando token de visualização
        window.open(`/api/pdf-viewer.php?token=${pdf.token_visualizacao}`, '_blank');
    };

    const downloadPdf = async (pdfId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/index.php?endpoint=pdfs&id=${pdfId}&action=download`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `documento_${pdfId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Erro ao fazer download:', err);
        }
    };

    React.useEffect(() => {
        fetchPdfs();
    }, [entradaId]);

    return (
        <div className="pdf-list">
            <h3>Documentos PDF</h3>
            
            {loading ? (
                <div>Carregando...</div>
            ) : (
                <div className="pdf-grid">
                    {pdfs.map(pdf => (
                        <div key={pdf.id} className="pdf-item">
                            <div className="pdf-info">
                                <h4>{pdf.NOME_ARQUIVO}</h4>
                                <p>Tamanho: {formatBytes(pdf.TAMANHO_ARQUIVO)}</p>
                                <p>Data: {new Date(pdf.DATA_REGISTRO).toLocaleDateString()}</p>
                                {pdf.DESCRICAO && <p>Descrição: {pdf.DESCRICAO}</p>}
                            </div>
                            
                            <div className="pdf-actions">
                                <button onClick={() => openPdf(pdf)}>
                                    👁️ Visualizar
                                </button>
                                <button onClick={() => downloadPdf(pdf.id)}>
                                    📥 Download
                                </button>
                                <button 
                                    onClick={() => deletePdf(pdf.id)}
                                    className="delete-btn"
                                >
                                    🗑️ Deletar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ========================================
// 3. COMPONENTE PRINCIPAL
// ========================================

const EntradaComPdfs = ({ entradaId }) => {
    const [uploadSuccess, setUploadSuccess] = useState(null);

    const handleUploadSuccess = (pdfData) => {
        setUploadSuccess(pdfData);
        // Aqui você pode atualizar a lista de PDFs automaticamente
    };

    return (
        <div className="entrada-pdfs">
            <h2>Gerenciar Documentos - Entrada #{entradaId}</h2>
            
            <div className="upload-section">
                <h3>Enviar Novo PDF</h3>
                <PdfUpload 
                    entradaId={entradaId} 
                    onUploadSuccess={handleUploadSuccess}
                />
            </div>
            
            <PdfList entradaId={entradaId} />
            
            {uploadSuccess && (
                <div className="success-message">
                    ✅ PDF enviado com sucesso!
                    <br />
                    <a 
                        href={`/api/pdf-viewer.php?token=${uploadSuccess.token_visualizacao}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Visualizar PDF
                    </a>
                </div>
            )}
        </div>
    );
};

// ========================================
// 4. FUNÇÕES AUXILIARES
// ========================================

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ========================================
// 5. ESTILOS CSS (opcional)
// ========================================

const styles = `
.pdf-upload {
    border: 2px dashed #ccc;
    padding: 20px;
    text-align: center;
    margin: 20px 0;
}

.progress {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0;
}

.progress-bar {
    height: 100%;
    background-color: #007bff;
    transition: width 0.3s ease;
}

.pdf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.pdf-item {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
    background: white;
}

.pdf-actions {
    margin-top: 10px;
    display: flex;
    gap: 10px;
}

.pdf-actions button {
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
}

.pdf-actions button:hover {
    opacity: 0.8;
}

.delete-btn {
    background-color: #dc3545;
    color: white;
}

.success-message {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
    padding: 15px;
    border-radius: 5px;
    margin: 20px 0;
}
`;

// ========================================
// 6. EXEMPLO DE USO
// ========================================

// No seu componente principal:
/*
import { EntradaComPdfs } from './components/PdfUpload';

function App() {
    return (
        <div>
            <EntradaComPdfs entradaId={123} />
        </div>
    );
}
*/

export { PdfUpload, PdfList, EntradaComPdfs, formatBytes };
