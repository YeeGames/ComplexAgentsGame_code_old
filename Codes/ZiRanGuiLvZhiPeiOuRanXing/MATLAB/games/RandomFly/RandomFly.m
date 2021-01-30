%% relatly function
% chessboard.pos : show the positions of palyer  at chessboard
% chessboard.color : show the color at chessboard


%%
clc;
clear all;
close all;






%% set parameters
Args.game='RandomFly';
Args.rule='1';
Args.sizeOfChessboard = 12;
Args.numPlayers=4;
Args.visual='yes';
Args.howManyTimesOfExperiment = 1;
Args.pauseTime=0.000;

Args

% 设置项
%% parameters
str020=datestr(now,'yyyymmdd');
folderName020=(str020);
str025=num2str(Args.howManyTimesOfExperiment);
folderName025=str025;
folderParentPath01=('./results/Export Data');
folderPath01=([folderParentPath01,'/',folderName020,'/',folderName025]);
sentence015=(['mkdir(''',folderPath01,''');']);
eval(sentence015);
clear folderName020 folderName025 str020 str025 folderParentPath01 ...
    folderPath01 sentence015;
Pros = Args;

%% set properties

% public properties
load('./resources/playerColorNames');

for i =1:Args.numPlayers
    player(i).id=playerColorNames{i,1};
    player(i).colorName=playerColorNames{i,2};
    player(i).colorSign=playerColorNames{i,3};
    player(i).color=playerColorNames{i,4}
    player(i).pos=[];
end


% private properties
chessboard.pos=zeros(Args.sizeOfChessboard,Args.sizeOfChessboard);
chessboard.color=zeros(Args.sizeOfChessboard,Args.sizeOfChessboard,3);
Pros.numOfPoints=Args.sizeOfChessboard^2;


%% layout
%% randomized average layout

temp010=(randperm(Pros.numOfPoints)).';
temp020=Pros.numOfPoints/Args.numPlayers;
for i=1:Args.numPlayers
    player(i).pos=[player(i).pos;temp010((i-1)*temp020+1:i*temp020)];
    chessboard.pos(player(i).pos)=player(i).id;
end
clear temp010 temp020;

%% visualization
[ chessboard,Pros ] = visualizeChessboard(chessboard,player,Pros );

%% playing
isContinueCriterions=1;
while isContinueCriterions>0
    isContinueCriterions=1;
    
    % dicing to select players and position at checkboard
    attacker=randi([1,Args.numPlayers]);
    attackPos = randi([1,Args.sizeOfChessboard],1,2);
    attackPos=sub2ind([Args.sizeOfChessboard Args.sizeOfChessboard],attackPos(1),attackPos(2));
    
    % choose a player change its chessman
    defender=chessboard.pos(attackPos);
    indexOfDefenderPos=find(player(defender).pos==attackPos);
    player(defender).pos(indexOfDefenderPos)=[];
    player(attacker).pos(end+1)=attackPos;
    chessboard.pos(attackPos)=player(attacker).id;
    
    %% visualization
    [ chessboard,Pros ]  = visualizeChessboard(chessboard,player,Pros );
%      [ chessboard,Pros ] = visualizeChessboardUpdate( player,attacker,attackPos,chessboard,Args,Pros );    pause(Args.pauseTime);
    %%
    % stop criterions .game overed when one of a players has died.
    for i=1:Args.numPlayers
        isContinueCriterions=isContinueCriterions.*sum(sum(player(i).pos));
    end
end

%% count sort and publisher
score = countScore( Args, player);

%% end
% pause;











