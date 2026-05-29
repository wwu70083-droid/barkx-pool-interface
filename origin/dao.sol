// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract BarkDAOV3 is Ownable {
    address public recipient;
    address public highestParentAddress;
    
    // 全局注册开关 (Req 6)
    bool public disableRegister; 

    struct Member {
        address parent;
        uint256 joinedBlock;
    }

    // 预编码部署数据结构 (Req 7)
    struct InitMember {
        address from;
        address parent;
    }

    struct Pay {
        uint256 registrationFee;
        bool state;
    }

    mapping(address => Member) public members;
    mapping(address => Pay) public payInfo;
    
    // 单地址下方直属注册开关 (Req 6)
    mapping(address => bool) public disableChildRegistration; 

    mapping(address => address[]) public children;
    mapping(address => uint256) public levels;

    event MemberRegistered(address indexed member, address indexed parent, uint256 level);
    event PayInfoUpdated(address indexed token, uint256 registrationFee, bool state);
    event AddressRulesUpdated(address indexed target, bool disableChildRegistration);
    event ChangeRecipient(address newRecipient);
    event StatusChanged(bool status);

    receive() external payable {}

    constructor(
        address _highestParent,
        address _recipient,
        address _owner,
        InitMember[] memory _initMembers
    ) Ownable(_owner) {
        require(_highestParent != address(0), "Invalid highest parent");
        require(_recipient != address(0), "Invalid recipient");

        highestParentAddress = _highestParent;
        recipient = _recipient;

        // 初始化根节点
        members[highestParentAddress] = Member(address(0), block.number);
        levels[highestParentAddress] = 0;

        // 首个默认的以太坊注册费用配置为 0.0005 ETH (Req 5)
        payInfo[address(0)] = Pay(0.0005 ether, true);

        // 预编码用户地址树部署 (Req 7)
        // 注意：传入的 _initMembers 数组必须按层级顺序排列（先父节点后子节点）
        for (uint256 i = 0; i < _initMembers.length; i++) {
            InitMember memory m = _initMembers[i];
            require(m.from != address(0), "Invalid member address");
            require(_isRegistered(m.parent), "Parent not initialized");
            require(!_isRegistered(m.from), "Member already initialized");

            members[m.from] = Member(m.parent, block.number);
            levels[m.from] = levels[m.parent] + 1;
            children[m.parent].push(m.from);
        }
    }

    // 判断用户是否已注册
    function _isRegistered(address user) internal view returns (bool) {
        return user == highestParentAddress || members[user].parent != address(0);
    }

    // ==========================================
    // Admin Functions (配合 2/3 多签)
    // ==========================================

    function setDisableRegister(bool _disable) external onlyOwner {
        disableRegister = _disable;
        emit StatusChanged(_disable);
    }

    function changeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        recipient = newRecipient;
        emit ChangeRecipient(newRecipient);
    }

    function updatePayInfo(
        address token,
        uint256 registrationFee,
        bool state
    ) external onlyOwner {
        payInfo[token] = Pay(registrationFee, state);
        emit PayInfoUpdated(token, registrationFee, state);
    }

    // 批量设置单地址直属注册开关 (Req 6)
    function setDisableChildRegistrationBatch(
        address[] calldata targets,
        bool disable
    ) external onlyOwner {
        for (uint256 i = 0; i < targets.length; i++) {
            disableChildRegistration[targets[i]] = disable;
            emit AddressRulesUpdated(targets[i], disable);
        }
    }

    // 管理员手动添加用户 (Req 1: 允许注册在 highestParent 下方)
    function adminAddMember(address member, address parent) external onlyOwner {
        require(member != address(0), "Invalid member address");
        require(!_isRegistered(member), "Already registered");
        require(_isRegistered(parent), "Parent does not exist");

        members[member] = Member(parent, block.number);
        uint256 newLevel = levels[parent] + 1;
        levels[member] = newLevel;
        children[parent].push(member);

        emit MemberRegistered(member, parent, newLevel);
    }

    // ==========================================
    // Public Functions
    // ==========================================

    // 注册并自动具备团队建设能力 (Req 2)
    function register(address parent, address token, uint256 amount) external payable {
        require(!disableRegister, "Registration globally disabled");
        // Req 1: 不允许普通用户直接注册在 highestParent 下方
        require(parent != highestParentAddress, "Cannot register directly under root"); 
        require(!disableChildRegistration[parent], "Parent is banned from accepting children");
        require(_isRegistered(parent), "Parent does not exist");
        require(!_isRegistered(msg.sender), "Already registered");

        // 动态无上限计算等级 (Req 3, Req 4)
        uint256 newLevel = levels[parent] + 1;

        members[msg.sender] = Member(parent, block.number);
        levels[msg.sender] = newLevel;
        children[parent].push(msg.sender);

        pay(token, amount);

        emit MemberRegistered(msg.sender, parent, newLevel);
    }

    function pay(address token, uint256 amount) internal {
        Pay memory p = payInfo[token];
        require(p.state, "Payment token not supported");

        if (msg.value > 0) {
            require(msg.value >= p.registrationFee, "Insufficient fee");
            Address.sendValue(payable(recipient), msg.value);
        } else {
            require(amount >= p.registrationFee, "Insufficient fee");
            IERC20(token).transferFrom(msg.sender, recipient, amount);
        }
    }

    // ==========================================
    // View Functions
    // ==========================================

    function getLevel(address addr) external view returns (uint256) {
        return levels[addr];
    }

    // 修复了 V2 中页码越界会导致 revert 的问题，提升前端查询体验
    function getChildren(
        address addr,
        uint256 page,
        uint256 pageSize
    ) external view returns (address[] memory) {
        address[] memory childList = children[addr];
        uint256 totalChildren = childList.length;

        if (totalChildren == 0 || pageSize == 0) {
            return new address[](0);
        }

        uint256 start = (page - 1) * pageSize;
        if (start >= totalChildren) {
            return new address[](0);
        }

        uint256 end = start + pageSize > totalChildren ? totalChildren : start + pageSize;
        uint256 length = end - start;
        address[] memory paginatedChildren = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            paginatedChildren[i] = childList[start + i];
        }

        return paginatedChildren;
    }
}