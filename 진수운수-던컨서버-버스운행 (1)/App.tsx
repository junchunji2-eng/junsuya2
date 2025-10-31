
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Knight, Client, Party } from './types';
import { PlusIcon, MinusIcon, TrashIcon, UsersIcon, CheckIcon, ShieldCheckIcon, UserCircleIcon, EditIcon, PowerIcon, DocumentDuplicateIcon, DocumentAddIcon } from './components/icons';

// Helper Components (defined outside the main App component to avoid re-creation on re-renders)

interface AddFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  placeholder: string;
  required?: boolean;
}

interface AddFormProps {
  title: string;
  fields: AddFormField[];
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onAdd: (formData: Record<string, any>) => void;
  icon: React.ReactNode;
}

const AddForm: React.FC<AddFormProps> = ({ title, fields, isOpen, setIsOpen, onAdd, icon }) => {
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {};
    fields.forEach(field => {
      initialState[field.name] = field.type === 'number' ? '' : '';
    });
    return initialState;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    // Reset form
    const resetState: Record<string, any> = {};
    fields.forEach(field => {
      resetState[field.name] = field.type === 'number' ? '' : '';
    });
    setFormData(resetState);
    setIsOpen(false);
  };

  return (
    <div className="mb-6 bg-gray-800 rounded-lg shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left text-xl font-bold text-white focus:outline-none"
      >
        <div className="flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
        </div>
        {isOpen ? <MinusIcon /> : <PlusIcon />}
      </button>
      {isOpen && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          {fields.map(field => (
            <div key={field.name} className="mb-4">
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
              {field.type === 'textarea' ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={field.required ?? true}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={field.required ?? true}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
            </div>
          ))}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition duration-300">
            추가하기
          </button>
        </form>
      )}
    </div>
  );
};


interface CardProps {
  children: React.ReactNode;
  isSelected: boolean;
}

const Card: React.FC<CardProps> = ({ children, isSelected }) => {
    const borderClass = isSelected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-700';
    return (
        <div className={`relative bg-gray-800 p-4 rounded-lg shadow-md border-2 transition-all duration-300 ${borderClass}`}>
            {children}
        </div>
    );
};


interface DeletionModalProps {
    itemType: string;
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeletionModal: React.FC<DeletionModalProps> = ({ itemType, itemName, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-sm w-full">
                <h3 className="text-xl font-bold text-white mb-4">삭제 확인</h3>
                <p className="text-gray-300 mb-6">정말로 {itemType} '{itemName}' 님을 목록에서 삭제하시겠습니까?</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition">취소</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-md transition">삭제</button>
                </div>
            </div>
        </div>
    );
}

interface EditModalProps {
    item: Knight | Client;
    onUpdate: (data: Record<string, any>) => void;
    onCancel: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onUpdate, onCancel }) => {
    const isKnight = 'relayCount' in item;
    const itemType = isKnight ? '기사' : '손님';
    const fields: AddFormField[] = [
        { name: 'name', label: '이름', type: 'text', placeholder: `${itemType}의 이름을 입력하세요` },
        { name: 'job', label: '직업', type: 'text', placeholder: `${itemType}의 직업을 입력하세요` },
        { name: 'power', label: '전투력', type: 'number', placeholder: `${itemType}의 전투력을 입력하세요` },
    ];
    if (!isKnight) {
        fields.push({ name: 'notes', label: '특이사항', type: 'textarea', placeholder: '손님의 특이사항을 입력하세요', required: false });
    }

    const [formData, setFormData] = useState<Record<string, any>>(() => {
        return {
            name: item.name,
            job: item.job,
            power: item.power / 1000,
            notes: 'notes' in item ? item.notes : '',
        };
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-md w-full">
                <h3 className="text-xl font-bold text-white mb-6">'{item.name}' 정보 수정</h3>
                <form onSubmit={handleSubmit}>
                    {fields.map(field => (
                        <div key={field.name} className="mb-4">
                            <label htmlFor={`edit-${field.name}`} className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    id={`edit-${field.name}`}
                                    name={field.name}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    required={field.required ?? true}
                                    rows={3}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            ) : (
                                <input
                                    id={`edit-${field.name}`}
                                    name={field.name}
                                    type={field.type}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    required={field.required ?? true}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end space-x-4 mt-8">
                        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition">취소</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition">저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface CompletionModalProps {
    partyId: number;
    onConfirm: () => void;
    onCancel: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({ partyId, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-sm w-full">
                <h3 className="text-xl font-bold text-white mb-4">임무 완료 확인</h3>
                <p className="text-gray-300 mb-6">정말로 파티 #{partyId}의 임무를 완료하시겠습니까? 완료된 파티는 목록에서 삭제됩니다.</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition">취소</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md transition">완료</button>
                </div>
            </div>
        </div>
    );
};

interface ExportModalProps {
    title: string;
    data: string;
    onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ title, data, onClose }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        if (textareaRef.current) {
            textareaRef.current.select();
            try {
                const successful = document.execCommand('copy');
                const msg = successful ? '복사되었습니다!' : '복사에 실패했습니다.';
                setCopySuccess(msg);
                setTimeout(() => setCopySuccess(''), 2000); // Hide message after 2s
            } catch (err) {
                setCopySuccess('복사에 실패했습니다.');
                setTimeout(() => setCopySuccess(''), 2000);
            }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                <p className="text-gray-300 mb-4">아래 텍스트를 복사하여 외부 파일에 저장하세요.</p>
                <textarea
                    ref={textareaRef}
                    readOnly
                    value={data}
                    className="w-full h-64 bg-gray-900 border border-gray-600 rounded-md p-3 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-end items-center space-x-4 mt-6">
                    {copySuccess && <span className="text-green-400 text-sm">{copySuccess}</span>}
                    <button onClick={handleCopy} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition">복사</button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition">닫기</button>
                </div>
            </div>
        </div>
    );
};

interface ImportModalProps {
    onClose: () => void;
    onImport: (data: string) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
    const [data, setData] = useState('');

    const handleImport = () => {
        onImport(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 shadow-2xl max-w-lg w-full">
                <h3 className="text-xl font-bold text-white mb-4">기사 정보 삽입</h3>
                <p className="text-gray-300 mb-4">아래 텍스트 영역에 '이름:직업:전투력:릴레이횟수' 형식으로 데이터를 붙여넣으세요. (한 줄에 한 명)</p>
                <textarea
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder={'예시)\n홍길동:도적:50000:3\n김철수:마법사:120000:10'}
                    className="w-full h-64 bg-gray-900 border border-gray-600 rounded-md p-3 text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="flex justify-end items-center space-x-4 mt-6">
                    <button onClick={handleImport} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-md transition">삽입하기</button>
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition">닫기</button>
                </div>
            </div>
        </div>
    );
};


// Main App Component
const App: React.FC = () => {
    const [knights, setKnights] = useState<Knight[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [parties, setParties] = useState<Party[]>([]);
    const [selectedKnightIds, setSelectedKnightIds] = useState<number[]>([]);
    const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
    const [partyIdCounter, setPartyIdCounter] = useState(1);

    const [isKnightFormOpen, setIsKnightFormOpen] = useState(false);
    const [isClientFormOpen, setIsClientFormOpen] = useState(false);

    const [itemToDelete, setItemToDelete] = useState<{type: 'knight' | 'client', id: number} | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Knight | Client | null>(null);
    const [partyToCompleteId, setPartyToCompleteId] = useState<number | null>(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [exportedKnightData, setExportedKnightData] = useState('');

    const handleAddKnight = (data: Record<string, any>) => {
        const newKnight: Knight = {
            id: Date.now(),
            name: data.name,
            job: data.job,
            power: data.power * 1000,
            relayCount: 0,
            status: 'waiting',
        };
        setKnights(prev => [...prev, newKnight]);
    };

    const handleAddClient = (data: Record<string, any>) => {
        const newClient: Client = {
            id: Date.now(),
            name: data.name,
            job: data.job,
            power: data.power * 1000,
            notes: data.notes,
            status: 'waiting',
        };
        setClients(prev => [...prev, newClient]);
    };

    const handleUpdateItem = (updatedData: Record<string, any>) => {
        if (!itemToEdit) return;

        const updatedItem = {
            ...itemToEdit,
            ...updatedData,
            power: updatedData.power * 1000,
        };

        if ('relayCount' in itemToEdit) {
            setKnights(prev => prev.map(k => (k.id === itemToEdit.id ? (updatedItem as Knight) : k)));
        } else {
            setClients(prev => prev.map(c => (c.id === itemToEdit.id ? (updatedItem as Client) : c)));
        }
        setItemToEdit(null);
    };

    const handleDelete = () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'knight') {
            setKnights(knights.filter(k => k.id !== itemToDelete.id));
        } else {
            setClients(clients.filter(c => c.id !== itemToDelete.id));
        }
        setItemToDelete(null);
    };

    const toggleSelection = (id: number, type: 'knight' | 'client') => {
        if (type === 'knight') {
            const knight = knights.find(k => k.id === id);
            if (knight && knight.status !== 'waiting') return;
            
            setSelectedKnightIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        } else {
            const client = clients.find(c => c.id === id);
            if (client && client.status !== 'waiting') return;

            setSelectedClientIds(prev =>
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
            );
        }
    };

    const handleCreateParty = () => {
        if (selectedKnightIds.length === 0 || selectedClientIds.length === 0) {
            alert('기사와 손님을 각각 1명 이상 선택해주세요.');
            return;
        }

        const partyKnights = knights.filter(k => selectedKnightIds.includes(k.id));
        const partyClients = clients.filter(c => selectedClientIds.includes(c.id));

        const newParty: Party = {
            id: partyIdCounter,
            knights: partyKnights,
            clients: partyClients,
            isCompleted: false,
        };

        setParties(prev => [...prev, newParty]);
        
        setKnights(prevKnights => 
            prevKnights.map(k => 
                selectedKnightIds.includes(k.id) ? { ...k, status: 'in-party' } : k
            )
        );
        setClients(prevClients =>
            prevClients.map(c =>
                selectedClientIds.includes(c.id) ? { ...c, status: 'in-party' } : c
            )
        );

        setPartyIdCounter(prev => prev + 1);
        setSelectedKnightIds([]);
        setSelectedClientIds([]);
    };
    
    const handleCompleteMission = useCallback((partyId: number) => {
        const partyToComplete = parties.find(p => p.id === partyId);
        if (!partyToComplete) return;

        const knightIds = partyToComplete.knights.map(k => k.id);
        const clientIds = partyToComplete.clients.map(c => c.id);

        setKnights(prevKnights =>
            prevKnights.map(k =>
                knightIds.includes(k.id) ? { ...k, relayCount: k.relayCount + 1, status: 'waiting' } : k
            )
        );

        setClients(prevClients =>
            prevClients.map(c =>
                clientIds.includes(c.id) ? { ...c, status: 'completed' } : c
            )
        );

        setParties(prevParties => prevParties.filter(p => p.id !== partyId));
    }, [parties]);

    const handleToggleKnightStatus = (knightId: number) => {
        setKnights(prevKnights =>
            prevKnights.map(k => {
                if (k.id === knightId) {
                    if (k.status === 'waiting') return { ...k, status: 'off-duty' };
                    if (k.status === 'off-duty') return { ...k, status: 'waiting' };
                }
                return k;
            })
        );
    };

    const handleExportKnights = () => {
        const data = sortedKnights
            .map(k => `${k.name}:${k.job}:${k.power}:${k.relayCount}`)
            .join('\n');
        setExportedKnightData(data);
        setIsExportModalOpen(true);
    };

    const handleImportKnights = (data: string) => {
        if (!data.trim()) {
            alert('삽입할 데이터가 없습니다.');
            return;
        }

        const lines = data.trim().split('\n');
        const newKnights: Knight[] = [];
        let invalidLines = 0;

        lines.forEach((line, index) => {
            const parts = line.split(':');
            if (parts.length === 4) {
                const [name, job, powerStr, relayCountStr] = parts;
                const power = parseInt(powerStr, 10);
                const relayCount = parseInt(relayCountStr, 10);

                if (name && job && !isNaN(power) && !isNaN(relayCount)) {
                    newKnights.push({
                        id: Date.now() + index, // Add index to prevent collisions
                        name: name.trim(),
                        job: job.trim(),
                        power: power,
                        relayCount: relayCount,
                        status: 'off-duty',
                    });
                } else {
                    invalidLines++;
                }
            } else {
                invalidLines++;
            }
        });

        if (newKnights.length > 0) {
            setKnights(prev => [...prev, ...newKnights]);
        }
        
        let alertMessage = `${newKnights.length}명의 기사를 성공적으로 추가했습니다.`;
        if (invalidLines > 0) {
            alertMessage += `\n(형식이 잘못된 ${invalidLines}개의 라인은 무시되었습니다.)`;
        }
        alert(alertMessage);
        
        setIsImportModalOpen(false);
    };

    const knightFields: AddFormField[] = [
        { name: 'name', label: '이름', type: 'text', placeholder: '기사의 이름을 입력하세요' },
        { name: 'job', label: '직업', type: 'text', placeholder: '기사의 직업을 입력하세요' },
        { name: 'power', label: '전투력', type: 'number', placeholder: '기사의 전투력을 입력하세요' },
    ];

    const clientFields: AddFormField[] = [
        { name: 'name', label: '이름', type: 'text', placeholder: '손님의 이름을 입력하세요' },
        { name: 'job', label: '직업', type: 'text', placeholder: '손님의 직업을 입력하세요' },
        { name: 'power', label: '전투력', type: 'number', placeholder: '손님의 전투력을 입력하세요' },
        { name: 'notes', label: '특이사항', type: 'textarea', placeholder: '손님의 특이사항을 입력하세요', required: false },
    ];
    
    const itemToDeleteDetails = itemToDelete ? (itemToDelete.type === 'knight' ? knights.find(k => k.id === itemToDelete.id) : clients.find(c => c.id === itemToDelete.id)) : null;

    const sortedKnights = useMemo(() => {
        const statusOrder = { 'waiting': 1, 'in-party': 2, 'off-duty': 3 };
        return [...knights].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }, [knights]);

    const firstOffDutyIndex = useMemo(() => 
        sortedKnights.findIndex(k => k.status === 'off-duty'),
        [sortedKnights]
    );

    const getKnightStatusDisplay = (knight: Knight) => {
        switch (knight.status) {
            case 'waiting':
                return { text: '대기중', className: 'bg-green-500/20 text-green-400' };
            case 'in-party':
                const party = parties.find(p => !p.isCompleted && p.knights.some(k => k.id === knight.id));
                return { text: `${party ? party.id : '?'}파티`, className: 'bg-blue-500/20 text-blue-400' };
            case 'off-duty':
                return { text: '퇴근', className: 'bg-gray-500/20 text-gray-500' };
            default:
                return { text: '알수없음', className: 'bg-red-500/20 text-red-400' };
        }
    };

    const getClientStatusDisplay = (client: Client) => {
        switch (client.status) {
            case 'waiting':
                return { text: '대기중', className: 'bg-gray-500/20 text-gray-400' };
            case 'in-party':
                const party = parties.find(p => !p.isCompleted && p.clients.some(c => c.id === client.id));
                return { text: `${party ? party.id : '?'}파티`, className: 'bg-blue-500/20 text-blue-400' };
            case 'completed':
                return { text: '완료함', className: 'bg-green-500/20 text-green-400' };
            default:
                return { text: '알수없음', className: 'bg-red-500/20 text-red-400' };
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
             {itemToDelete && itemToDeleteDetails && (
                <DeletionModal 
                    itemType={itemToDelete.type === 'knight' ? '기사' : '손님'}
                    itemName={itemToDeleteDetails.name}
                    onConfirm={handleDelete}
                    onCancel={() => setItemToDelete(null)}
                />
            )}
            {itemToEdit && (
                <EditModal
                    item={itemToEdit}
                    onUpdate={handleUpdateItem}
                    onCancel={() => setItemToEdit(null)}
                />
            )}
            {partyToCompleteId && (
                <CompletionModal
                    partyId={partyToCompleteId}
                    onConfirm={() => {
                        handleCompleteMission(partyToCompleteId);
                        setPartyToCompleteId(null);
                    }}
                    onCancel={() => setPartyToCompleteId(null)}
                />
             )}
            {isExportModalOpen && (
                <ExportModal
                    title="기사 정보 추출"
                    data={exportedKnightData}
                    onClose={() => setIsExportModalOpen(false)}
                />
            )}
             {isImportModalOpen && (
                <ImportModal
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportKnights}
                />
            )}
            <header className="text-center mb-12">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                    진수운수
                </h1>
                <div className="text-gray-400 mt-2">
                    <p>던컨서버 버스매칭!! 닉/직업/투력 채팅에 작성해주세요</p>
                    <p>진수야가 상시 확인을 못할수도 있으니 양해부탁드려요.</p>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Knights Section */}
                <section>
                    <AddForm title="기사 추가" fields={knightFields} isOpen={isKnightFormOpen} setIsOpen={setIsKnightFormOpen} onAdd={handleAddKnight} icon={<ShieldCheckIcon />} />
                    
                    <div className="border-t border-gray-700 my-6"></div>

                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">기사 명단</h2>
                        <div className="flex items-center space-x-2">
                             <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-3 rounded-md transition duration-300"
                            >
                                <DocumentAddIcon />
                                <span>정보 삽입</span>
                            </button>
                            <button
                                onClick={handleExportKnights}
                                disabled={knights.length === 0}
                                className="flex items-center text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-md transition duration-300"
                            >
                                <DocumentDuplicateIcon />
                                <span>정보 추출</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {sortedKnights.length > 0 ? sortedKnights.map((knight, index) => {
                            const separator = index === firstOffDutyIndex && firstOffDutyIndex > 0 ? (
                                <div className="relative flex items-center">
                                    <div className="flex-grow border-t border-gray-600"></div>
                                    <span className="flex-shrink mx-4 text-gray-500 text-sm font-semibold">퇴근</span>
                                    <div className="flex-grow border-t border-gray-600"></div>
                                </div>
                            ) : null;

                            const statusDisplay = getKnightStatusDisplay(knight);
                            const canBeSelected = knight.status === 'waiting';
                            return (
                                <React.Fragment key={knight.id}>
                                    {separator}
                                    <Card isSelected={selectedKnightIds.includes(knight.id)}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <h3 className="text-xl font-bold">
                                                    <span className="text-gray-200">{knight.job}</span>
                                                    <span className="text-gray-500 mx-2">|</span>
                                                    <span className="text-indigo-400">{knight.name}</span>
                                                </h3>
                                                <p className="text-gray-300">전투력: {knight.power}</p>
                                                <p className="text-gray-300">릴레이 횟수: {knight.relayCount}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                                <input type="checkbox" checked={selectedKnightIds.includes(knight.id)} onChange={() => toggleSelection(knight.id, 'knight')} className="form-checkbox h-8 w-8 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canBeSelected}/>
                                                <button onClick={() => setItemToEdit(knight)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full transition duration-300"><EditIcon /></button>
                                                <button onClick={() => handleToggleKnightStatus(knight.id)} disabled={knight.status === 'in-party'} className="p-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-full transition duration-300" title={knight.status === 'off-duty' ? '복귀' : '퇴근'}><PowerIcon/></button>
                                                <button onClick={() => setItemToDelete({type: 'knight', id: knight.id})} className="p-2 bg-red-600 hover:bg-red-500 rounded-full transition duration-300"><TrashIcon /></button>
                                            </div>
                                        </div>
                                        <div className={`absolute bottom-2 right-3 px-2 py-1 text-xs font-bold rounded-full ${statusDisplay.className}`}>
                                          {statusDisplay.text}
                                        </div>
                                    </Card>
                                </React.Fragment>
                        )}) : <p className="text-gray-500 text-center py-4">추가된 기사가 없습니다.</p>}
                    </div>
                </section>

                {/* Clients Section */}
                <section>
                    <AddForm title="손님 추가" fields={clientFields} isOpen={isClientFormOpen} setIsOpen={setIsClientFormOpen} onAdd={handleAddClient} icon={<UserCircleIcon />} />
                    <div className="space-y-4">
                        {clients.map(client => {
                            const statusDisplay = getClientStatusDisplay(client);
                            const isCompleted = client.status === 'completed';
                            return (
                            <Card key={client.id} isSelected={selectedClientIds.includes(client.id)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold">
                                            <span className="text-purple-400">{client.name}</span>
                                            <span className="text-gray-500 mx-2">|</span>
                                            <span className="text-gray-200">{client.job}</span>
                                        </h3>
                                        <p className="text-gray-300">요구 전투력: {client.power}</p>
                                        <p className="text-gray-300 mt-2"><span className="font-semibold">특이사항:</span> {client.notes}</p>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                        <input type="checkbox" checked={selectedClientIds.includes(client.id)} onChange={() => toggleSelection(client.id, 'client')} className="form-checkbox h-8 w-8 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed" disabled={client.status !== 'waiting'} />
                                        <button onClick={() => setItemToEdit(client)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full transition duration-300"><EditIcon /></button>
                                        <button 
                                          onClick={() => setItemToDelete({type: 'client', id: client.id})} 
                                          className={`p-2 rounded-full transition duration-300 ${isCompleted ? 'bg-green-500 hover:bg-green-400 animate-pulse' : 'bg-red-600 hover:bg-red-500'}`}
                                          title={isCompleted ? "임무 완료! 삭제 가능" : "삭제"}
                                        >
                                          <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                                <div className={`absolute bottom-2 right-3 px-2 py-1 text-xs font-bold rounded-full ${statusDisplay.className}`}>
                                    {statusDisplay.text}
                                </div>
                            </Card>
                        )})}
                    </div>
                </section>

                {/* Party Section */}
                <section>
                    <div className="sticky top-8">
                        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
                            <h2 className="text-xl font-bold mb-4 text-center">파티 생성</h2>
                            <button
                                onClick={handleCreateParty}
                                disabled={selectedKnightIds.length === 0 || selectedClientIds.length === 0}
                                className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition duration-300"
                            >
                                <UsersIcon />
                                파티 매칭 ({selectedKnightIds.length} 기사, {selectedClientIds.length} 손님)
                            </button>
                        </div>
                        <h2 className="text-2xl font-bold mb-4">생성된 파티</h2>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {parties.map(party => (
                                <div key={party.id} className="bg-gray-800 p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
                                    <div className="flex justify-between items-start">
                                      <h3 className="text-lg font-bold mb-2">파티 #{party.id}</h3>
                                      <button 
                                        onClick={() => setPartyToCompleteId(party.id)}
                                        className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md transition duration-300"
                                      >
                                        <CheckIcon />
                                        임무 완료
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        <div>
                                            <h4 className="font-semibold text-indigo-400 mb-2">기사</h4>
                                            <ul className="list-disc list-inside text-gray-300">
                                                {party.knights.map(k => <li key={k.id}>{k.job} | {k.name}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-purple-400 mb-2">손님</h4>
                                            <ul className="list-disc list-inside text-gray-300">
                                                {party.clients.map(c => <li key={c.id}>{c.job} | {c.name}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {parties.length === 0 && <p className="text-gray-500 text-center">생성된 파티가 없습니다.</p>}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default App;
