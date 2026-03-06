import { Typography, Card, Avatar, Spin, Input, Empty } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useState, useMemo } from 'react';

const { Title, Text } = Typography;

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    role: string;
    designation?: { name: string };
    department?: { name: string };
    managerId: string | null;
    children?: Employee[];
}

// ------- Recursive Node -------
function OrgNode({ node, depth = 0, matchedIds }: { node: Employee; depth?: number; matchedIds: Set<string> | null }) {
    const isHighlighted = !matchedIds || matchedIds.has(node.id);
    const borderColors = [
        'border-t-brand-red',
        'border-t-blue-400',
        'border-t-amber-400',
        'border-t-green-400',
        'border-t-purple-400',
    ];
    const border = borderColors[depth % borderColors.length];

    return (
        <div className="flex flex-col items-center" style={{ opacity: isHighlighted ? 1 : 0.3, transition: 'opacity 0.2s' }}>
            {/* Node Card */}
            <div
                className={`relative bg-white rounded-xl shadow-sm border border-slate-100 border-t-2 ${border} p-4 w-52 flex flex-col items-center gap-1 hover:shadow-md transition-shadow cursor-default`}
            >
                <Avatar
                    size={44}
                    icon={<UserOutlined />}
                    className="bg-slate-200 text-slate-500 flex-shrink-0"
                    style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                >
                    {node.firstName.charAt(0)}
                </Avatar>
                <div className="text-center mt-1">
                    <div className="font-semibold text-slate-800 text-sm leading-tight">
                        {node.firstName} {node.lastName}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                        {node.designation?.name || node.role}
                    </div>
                    {node.department && (
                        <div className="text-xs text-slate-400">{node.department.name}</div>
                    )}
                </div>
            </div>

            {/* Children */}
            {node.children && node.children.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Vertical connector from parent */}
                    <div className="w-px h-6 bg-slate-300" />
                    {/* Horizontal bar */}
                    {node.children.length > 1 && (
                        <div
                            className="h-px bg-slate-300"
                            style={{
                                width: `calc(${node.children.length} * 224px - 112px)`,
                            }}
                        />
                    )}
                    {/* Children Row */}
                    <div className="flex gap-8 items-start">
                        {node.children.map((child) => (
                            <div key={child.id} className="flex flex-col items-center">
                                {/* Vertical connector to child */}
                                <div className="w-px h-6 bg-slate-300" />
                                <OrgNode node={child} depth={depth + 1} matchedIds={matchedIds} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ------- Build Tree Utility (always uses all employees) -------
function buildTree(employees: Employee[]): Employee[] {
    const map: Record<string, Employee> = {};
    // First pass: populate map with cloned nodes
    employees.forEach((e) => { map[e.id] = { ...e, children: [] }; });

    const roots: Employee[] = [];
    // Second pass: wire up parent-child relationships
    employees.forEach((e) => {
        if (e.managerId && map[e.managerId]) {
            map[e.managerId].children!.push(map[e.id]);
        } else {
            // No manager in the dataset → treat as root
            roots.push(map[e.id]);
        }
    });
    return roots;
}

// ------- Main Page -------
export default function OrgChart() {
    const [search, setSearch] = useState('');

    const { data: employeesData, isLoading } = useQuery({
        queryKey: ['employees', 'org-chart'],
        queryFn: async () => {
            // Fetch all employees without status filter so hierarchy is always complete
            const res = await apiClient.get('/employees?limit=200');
            return res.data?.data || [];
        },
    });

    // Build the tree once from the full dataset — searching doesn't break parent-child links
    const tree = useMemo(() => buildTree(employeesData || []), [employeesData]);

    // For search: just compute which IDs match (used to visually dim non-matches)
    const matchedIds = useMemo(() => {
        if (!search) return null; // null = show all
        const lower = search.toLowerCase();
        return new Set<string>(
            (employeesData || []).filter((e: Employee) =>
                `${e.firstName} ${e.lastName}`.toLowerCase().includes(lower) ||
                e.designation?.name?.toLowerCase().includes(lower)
            ).map((e: Employee) => e.id)
        );
    }, [employeesData, search]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <Title level={3} className="!mb-1">Organisation Chart</Title>
                    <Text className="text-slate-500">Visual hierarchy of your team structure.</Text>
                </div>
                <Input
                    placeholder="Search by name or designation"
                    prefix={<SearchOutlined />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 bg-white border-slate-200"
                    allowClear
                />
            </div>

            <Card bordered={false} className="shadow-sm overflow-auto">
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Spin size="large" />
                    </div>
                ) : tree.length === 0 ? (
                    <Empty description="No employees found" />
                ) : (
                    <div className="p-6 overflow-x-auto">
                        <div className="flex gap-16 items-start justify-start min-w-max pb-4">
                            {tree.map((root) => (
                                <OrgNode key={root.id} node={root} depth={0} matchedIds={matchedIds} />
                            ))}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
