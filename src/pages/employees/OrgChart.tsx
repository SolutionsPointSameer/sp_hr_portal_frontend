import React, { useMemo, useState } from 'react';
import { Card, Select, Modal, message, Typography, Avatar, Spin } from 'antd';
import { UserOutlined, EditOutlined, BranchesOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

const { Title, Text } = Typography;

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  managerId: string | null;
  designation?: { name: string };
  department?: { name: string };
}

interface TreeNode extends Employee {
  children: TreeNode[];
}

export default function OrgChartView() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newManagerId, setNewManagerId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Employee[]>({
    queryKey: ['org-chart'],
    queryFn: async () => {
      const res = await apiClient.get('/employees/org-chart');
      return res.data;
    }
  });

  const updateManagerMutation = useMutation({
    mutationFn: async (vars: { id: string; managerId: string | null }) => {
      await apiClient.patch(`/employees/${vars.id}`, { managerId: vars.managerId });
    },
    onSuccess: () => {
      message.success('Manager updated successfully');
      queryClient.invalidateQueries({ queryKey: ['org-chart'] });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || 'Failed to update manager');
    }
  });

  const generateTree = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    data.forEach(emp => {
      map.set(emp.id, { ...emp, children: [] });
    });

    data.forEach(emp => {
      const node = map.get(emp.id)!;
      if (emp.managerId && map.has(emp.managerId)) {
        map.get(emp.managerId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [data]);

  const handleEdit = React.useCallback((emp: Employee) => {
    setSelectedEmployee(emp);
    setNewManagerId(emp.managerId);
    setIsModalOpen(true);
  }, []);

  const handleSaveManager = () => {
    if (selectedEmployee) {
      if (selectedEmployee.id === newManagerId) {
        message.warning("An employee cannot be their own manager");
        return;
      }
      // Simple cycle detection (is newManagerId a descending child of selectedEmployee?)
      const isDescendant = (parentId: string, targetId: string): boolean => {
         const node = data?.find(e => e.id === parentId);
         if (!node) return false;
         const children = data?.filter(e => e.managerId === parentId) || [];
         for (const child of children) {
            if (child.id === targetId) return true;
            if (isDescendant(child.id, targetId)) return true;
         }
         return false;
      };

      if (newManagerId && isDescendant(selectedEmployee.id, newManagerId)) {
          message.error("Cannot set a subordinate as a manager (cycle detected)");
          return;
      }

      updateManagerMutation.mutate({ id: selectedEmployee.id, managerId: newManagerId });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Spin size="large" /></div>;
  }

const OrgNode = React.memo(({ node, onEdit }: { node: TreeNode, onEdit: (emp: Employee) => void }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      <div className="relative group p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all min-w-[220px] text-center z-10 hover:border-indigo-300">
        <Avatar size={54} icon={<UserOutlined />} className="mb-3 bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium whitespace-nowrap overflow-visible">
           {node.firstName[0]} {node.lastName[0]}
        </Avatar>
        <div className="font-semibold text-slate-800 text-[15px]">{node.firstName} {node.lastName}</div>
        <div className="text-[13px] font-medium text-indigo-600 mb-1.5">{node.designation?.name || '---'}</div>
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-2 py-1 bg-slate-50 rounded border border-slate-100 inline-block">
           {node.department?.name || '---'}
        </div>
        
        <button 
          onClick={() => onEdit(node)}
          title="Change Reporting Manager"
          className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white hover:bg-indigo-700 rounded-full w-8 h-8 flex items-center justify-center shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 z-20"
        >
          <EditOutlined className="text-sm" />
        </button>
      </div>

      {/* Children Render */}
      {node.children.length > 0 && (
        <div className="relative flex justify-center mt-6">
          {/* The vertical trunk from the parent */}
          <div className="absolute top-[-24px] left-1/2 w-[2px] h-6 bg-slate-300 -translate-x-1/2"></div>
          
          <div className="flex gap-4 relative">
            {node.children.map((child, idx) => {
              const isOnly = node.children.length === 1;
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;
              return (
                <div key={child.id} className="relative flex flex-col items-center px-2">
                  {/* Horizontal connector above */}
                  {!isOnly && (
                     <div 
                       className={`absolute top-0 h-[2px] bg-slate-300 ${
                         isFirst ? 'left-1/2 right-0' : isLast ? 'right-1/2 left-0' : 'left-0 right-0'
                       }`}
                     ></div>
                  )}
                  {/* Vertical drop to child */}
                  <div className="w-[2px] h-6 bg-slate-300"></div>
                  <div className="w-full">
                     <OrgNode node={child} onEdit={onEdit} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <BranchesOutlined className="text-2xl text-indigo-600" />
          </div>
          <div>
            <Title level={4} className="!mb-1 text-slate-800">Organizational Chart</Title>
            <Text className="text-slate-500">Interactive visualization of reporting hierarchy</Text>
          </div>
        </div>
      </div>

      <Card className="hover:shadow-md transition-shadow rounded-2xl border-slate-200 bg-slate-50/50 mb-8 min-h-[600px]">
         <div className="overflow-x-auto pb-8 pt-8 flex justify-center custom-scrollbar">
           {generateTree.length > 0 ? (
             <div className="flex gap-16">
               {generateTree.map(root => <OrgNode key={root.id} node={root} onEdit={handleEdit} />)}
             </div>
           ) : (
             <div className="text-slate-500 mt-20 flex flex-col items-center gap-2">
               <BranchesOutlined className="text-4xl text-slate-300" />
               <p>No active employees found to generate Org Chart</p>
             </div>
           )}
         </div>
      </Card>

      <Modal
        title={<div className="flex items-center gap-2 text-indigo-700 text-lg"><EditOutlined /> Edit Reporting Structure</div>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveManager}
        okText="Update Hierarchy"
        okButtonProps={{ loading: updateManagerMutation.isPending, className: "bg-indigo-600" }}
        className="rounded-xl overflow-hidden"
      >
        <div className="py-2">
          <div className="mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <Text className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Employee</Text>
            <div className="text-base font-bold text-slate-800">
              {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </div>
            <div className="text-sm font-medium text-slate-600">
              {selectedEmployee?.designation?.name || 'No Designation'}
            </div>
          </div>
          <div>
            <Text className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assign New Manager</Text>
            <Select
              className="w-full"
              size="large"
              placeholder="Search and select new manager"
              value={newManagerId}
              onChange={setNewManagerId}
              showSearch
              allowClear
              filterOption={(inputValue, option) => {
                 const label = (option?.label as React.ReactNode)?.toString().toLowerCase() || '';
                 return label.includes(inputValue.toLowerCase());
              }}
              options={(data || [])
                .filter(e => e.id !== selectedEmployee?.id)
                .map(e => ({
                  value: e.id,
                  label: `${e.firstName} ${e.lastName} - ${e.designation?.name || 'Unassigned'}`
                }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
