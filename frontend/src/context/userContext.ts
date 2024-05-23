import { createContext } from 'react';
import { UserContextType } from '../types/interfaces';

// User context
const UserContext = createContext<UserContextType | null>(null);

export default UserContext;
